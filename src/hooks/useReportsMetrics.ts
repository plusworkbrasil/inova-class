import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportsMetrics {
  // Métricas dos alunos
  studentsEnrolled: number;
  studentsAttending: number;
  studentsEvaded: number;
  
  // Métricas das turmas
  averageAttendanceRate: number;
  generalGradeAverage: number;
  averageStudentsPerClass: number;
  classWithFewerStudents: { name: string; count: number };
  classWithMoreStudents: { name: string; count: number };
}

export const useReportsMetrics = () => {
  const [metrics, setMetrics] = useState<ReportsMetrics>({
    studentsEnrolled: 0,
    studentsAttending: 0,
    studentsEvaded: 0,
    averageAttendanceRate: 0,
    generalGradeAverage: 0,
    averageStudentsPerClass: 0,
    classWithFewerStudents: { name: '', count: 0 },
    classWithMoreStudents: { name: '', count: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Buscar alunos matriculados (total de estudantes)
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('role', 'student');

      const studentsEnrolled = allStudents?.length || 0;
      const studentsAttending = allStudents?.filter(s => s.status === 'active').length || 0;

      // Buscar alunos evadidos
      const { data: evasions } = await supabase
        .from('evasions')
        .select('id, status')
        .eq('status', 'active');

      const studentsEvaded = evasions?.length || 0;

      // Buscar dados de frequência para calcular média
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('is_present');

      let averageAttendanceRate = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.is_present).length;
        averageAttendanceRate = Math.round((presentCount / attendanceData.length) * 100);
      }

      // Buscar dados de notas para calcular média geral
      const { data: gradesData } = await supabase
        .from('grades')
        .select('value');

      let generalGradeAverage = 0;
      if (gradesData && gradesData.length > 0) {
        const totalGrades = gradesData.reduce((sum, grade) => sum + parseFloat(grade.value.toString()), 0);
        generalGradeAverage = parseFloat((totalGrades / gradesData.length).toFixed(1));
      }

      // Buscar dados das turmas com contagem de alunos
      const { data: classesWithStudents } = await supabase
        .from('profiles')
        .select(`
          class_id,
          classes!inner(name)
        `)
        .eq('role', 'student');

      // Calcular estatísticas das turmas
      const classCount: Record<string, number> = {};
      
      classesWithStudents?.forEach(student => {
        const className = (student.classes as any)?.name || 'Sem Turma';
        classCount[className] = (classCount[className] || 0) + 1;
      });

      const classStats = Object.entries(classCount).map(([name, count]) => ({
        name,
        count
      }));

      const averageStudentsPerClass = classStats.length > 0 
        ? Math.round(classStats.reduce((sum, cls) => sum + cls.count, 0) / classStats.length)
        : 0;

      const sortedClasses = [...classStats].sort((a, b) => a.count - b.count);
      const classWithFewerStudents = sortedClasses[0] || { name: 'N/A', count: 0 };
      const classWithMoreStudents = sortedClasses[sortedClasses.length - 1] || { name: 'N/A', count: 0 };

      setMetrics({
        studentsEnrolled,
        studentsAttending,
        studentsEvaded,
        averageAttendanceRate,
        generalGradeAverage,
        averageStudentsPerClass,
        classWithFewerStudents,
        classWithMoreStudents
      });

    } catch (error) {
      console.error('Error fetching report metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    refetch: fetchMetrics
  };
};