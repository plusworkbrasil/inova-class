import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StudentWithExcessAbsences {
  student_id: string;
  student_name: string;
  student_enrollment: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  total_absences: number;
  total_classes: number;
  absence_percentage: number;
}

interface Statistics {
  totalStudents: number;
  topClass: { name: string; count: number } | null;
  topSubject: { name: string; count: number } | null;
  averagePercentage: number;
}

export const useStudentsWithExcessAbsences = () => {
  const [data, setData] = useState<StudentWithExcessAbsences[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    totalStudents: 0,
    topClass: null,
    topSubject: null,
    averagePercentage: 0
  });

  const fetchStudentsWithExcessAbsences = async (classId: string | null = null) => {
    try {
      setLoading(true);
      console.log('🔍 [useStudentsWithExcessAbsences] Buscando alunos faltosos', classId ? `para turma ${classId}` : '');

      // Buscar attendance de disciplinas ativas
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          student_id,
          subject_id,
          class_id,
          is_present
        `);

      // Não filtrar por class_id no attendance - será filtrado pelo profile depois

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Buscar apenas subjects ativos
      const { data: activeSubjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .eq('status', 'ativo');

      if (subjectsError) throw subjectsError;

      const activeSubjectIds = new Set(activeSubjects?.map(s => s.id));

      // Filtrar attendance apenas de subjects ativos
      const filteredAttendance = attendanceData?.filter(a => activeSubjectIds.has(a.subject_id)) || [];

      // Agrupar por student_id e subject_id
      const groupedData = new Map<string, {
        student_id: string;
        subject_id: string;
        class_id: string;
        total_classes: number;
        total_absences: number;
      }>();

      filteredAttendance.forEach(record => {
        const key = `${record.student_id}_${record.subject_id}`;
        const existing = groupedData.get(key);

        if (existing) {
          existing.total_classes++;
          if (!record.is_present) existing.total_absences++;
        } else {
          groupedData.set(key, {
            student_id: record.student_id,
            subject_id: record.subject_id,
            class_id: record.class_id,
            total_classes: 1,
            total_absences: record.is_present ? 0 : 1
          });
        }
      });

      // Incluir todos alunos com pelo menos 1 falta
      const studentsWithAbsences = Array.from(groupedData.values())
        .filter(item => item.total_absences >= 1);

      if (studentsWithAbsences.length === 0) {
        setData([]);
        setStatistics({
          totalStudents: 0,
          topClass: null,
          topSubject: null,
          averagePercentage: 0
        });
        return;
      }

      // Buscar dados dos alunos
      const studentIds = [...new Set(studentsWithAbsences.map(s => s.student_id))];
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, enrollment_number, class_id')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Buscar dados das turmas (usando class_id do profile)
      const profileClassIds = [...new Set((studentsData || []).map(s => s.class_id).filter(Boolean))] as string[];
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', profileClassIds.length > 0 ? profileClassIds : ['__none__']);

      if (classesError) throw classesError;

      // Criar mapas
      const studentsMap = new Map(studentsData?.map(s => [s.id, s]));
      const classesMap = new Map(classesData?.map(c => [c.id, c.name]));
      const subjectsMap = new Map(activeSubjects?.map(s => [s.id, s.name]));

      // Formatar resultados usando class_id do profile
      const formatted = studentsWithAbsences.map(item => {
        const student = studentsMap.get(item.student_id);
        const absence_percentage = (item.total_absences / item.total_classes) * 100;

        const profileClassId = student?.class_id || item.class_id;
        return {
          student_id: item.student_id,
          student_name: student?.name || 'N/A',
          student_enrollment: student?.enrollment_number || '-',
          class_id: profileClassId,
          class_name: classesMap.get(profileClassId) || 'N/A',
          subject_id: item.subject_id,
          subject_name: subjectsMap.get(item.subject_id) || 'N/A',
          total_absences: item.total_absences,
          total_classes: item.total_classes,
          absence_percentage: Math.round(absence_percentage * 10) / 10
        };
      })
      // Filtrar por turma do profile (não do attendance)
      .filter(item => !classId || item.class_id === classId)
      .sort((a, b) => b.total_absences - a.total_absences);

      // Calcular estatísticas
      const classCount = new Map<string, number>();
      const subjectCount = new Map<string, number>();
      let totalPercentage = 0;

      formatted.forEach(item => {
        classCount.set(item.class_name, (classCount.get(item.class_name) || 0) + 1);
        subjectCount.set(item.subject_name, (subjectCount.get(item.subject_name) || 0) + 1);
        totalPercentage += item.absence_percentage;
      });

      const topClassEntry = Array.from(classCount.entries()).sort((a, b) => b[1] - a[1])[0];
      const topSubjectEntry = Array.from(subjectCount.entries()).sort((a, b) => b[1] - a[1])[0];

      setStatistics({
        totalStudents: formatted.length,
        topClass: topClassEntry ? { name: topClassEntry[0], count: topClassEntry[1] } : null,
        topSubject: topSubjectEntry ? { name: topSubjectEntry[0], count: topSubjectEntry[1] } : null,
        averagePercentage: formatted.length > 0 ? Math.round((totalPercentage / formatted.length) * 10) / 10 : 0
      });

      console.log('✅ [useStudentsWithExcessAbsences] Encontrados:', formatted.length, 'alunos');
      setData(formatted);
      setError(null);
    } catch (err: any) {
      console.error('❌ [useStudentsWithExcessAbsences] Erro:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsWithExcessAbsences(selectedClassId);
  }, [selectedClassId]);

  const filterByClass = (classId: string | null) => {
    setSelectedClassId(classId);
  };

  const refetch = () => {
    fetchStudentsWithExcessAbsences(selectedClassId);
  };

  return {
    data,
    loading,
    error,
    statistics,
    selectedClassId,
    filterByClass,
    refetch
  };
};
