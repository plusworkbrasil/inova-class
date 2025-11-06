import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface StudentHistoryData {
  attendance: any[];
  grades: any[];
  subjects: Map<string, { name: string; attendance_count: number; grade_average: number; total_grades: number }>;
}

export const useStudentHistory = (studentId: string | null) => {
  const [data, setData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!studentId) {
      setData(null);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar frequência
        const { data: attendanceData, error: attError } = await supabase
          .from('attendance')
          .select(`
            id,
            date,
            is_present,
            justification,
            class_id,
            subject_id,
            classes!inner(name),
            subjects!inner(name)
          `)
          .eq('student_id', studentId)
          .order('date', { ascending: false });

        if (attError) throw attError;

        // Buscar notas
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select(`
            id,
            value,
            max_value,
            date,
            type,
            observations,
            subject_id,
            subjects!inner(id, name, code)
          `)
          .eq('student_id', studentId)
          .order('date', { ascending: false });

        if (gradesError) throw gradesError;

        // Formatar dados de frequência
        const formattedAttendance = (attendanceData || []).map((att: any) => ({
          ...att,
          class_name: att.classes?.name || 'Sem turma',
          subject_name: att.subjects?.name || 'Sem disciplina'
        }));

        // Agrupar por disciplina
        const subjectsMap = new Map();

        // Processar frequência por disciplina
        formattedAttendance.forEach((att: any) => {
          if (!subjectsMap.has(att.subject_id)) {
            subjectsMap.set(att.subject_id, {
              name: att.subject_name,
              attendance_count: 0,
              grade_average: 0,
              total_grades: 0
            });
          }
          const subject = subjectsMap.get(att.subject_id);
          subject.attendance_count++;
        });

        // Processar notas por disciplina
        (gradesData || []).forEach((grade: any) => {
          if (!subjectsMap.has(grade.subject_id)) {
            subjectsMap.set(grade.subject_id, {
              name: grade.subjects.name,
              attendance_count: 0,
              grade_average: 0,
              total_grades: 0
            });
          }
          const subject = subjectsMap.get(grade.subject_id);
          subject.total_grades++;
          subject.grade_average += (grade.value / grade.max_value) * 10;
        });

        // Calcular médias
        subjectsMap.forEach((subject) => {
          if (subject.total_grades > 0) {
            subject.grade_average = subject.grade_average / subject.total_grades;
          }
        });

        setData({
          attendance: formattedAttendance,
          grades: gradesData || [],
          subjects: subjectsMap
        });
      } catch (err: any) {
        console.error('Erro ao buscar histórico:', err);
        setError(err.message);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao carregar histórico do aluno.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, toast]);

  return { data, loading, error };
};
