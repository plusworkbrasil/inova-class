import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InstructorDashboardStats {
  myClasses: number;
  attendancePercentage: number; // Substituindo myStudents
  averageGrade: number; // Substituindo pendingAttendance
  evadedStudents: number; // Substituindo gradesToLaunch
}

export const useInstructorDashboardStats = () => {
  const [stats, setStats] = useState<InstructorDashboardStats>({
    myClasses: 0,
    attendancePercentage: 0,
    averageGrade: 0,
    evadedStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchInstructorStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useInstructorDashboardStats] Iniciando busca de estatísticas do instrutor...');
      console.log('🔍 [useInstructorDashboardStats] ID do instrutor:', profile.id);

      // Get subjects where instructor teaches
      console.log('🔍 [useInstructorDashboardStats] Buscando disciplinas do instrutor...');
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .or(`teacher_id.eq.${profile.id}${profile.instructor_subjects && profile.instructor_subjects.length > 0 ? `,name.in.(${profile.instructor_subjects.map(s => `"${s}"`).join(',')})` : ''}`);

      if (subjectsError) {
        console.error('❌ [useInstructorDashboardStats] Erro ao buscar disciplinas:', subjectsError.message);
        throw subjectsError;
      }
      
      console.log(`✅ [useInstructorDashboardStats] Disciplinas encontradas: ${subjects?.length || 0}`);

      const subjectIds = subjects?.map(s => s.id) || [];
      const classIds = [...new Set(subjects?.map(s => s.class_id).filter(Boolean))];

      // Count unique classes
      const myClasses = classIds.length;

      // 1. Calcular porcentagem de presença (attendancePercentage)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('is_present')
        .in('subject_id', subjectIds.length > 0 ? subjectIds : ['00000000-0000-0000-0000-000000000000']);

      if (attendanceError) throw attendanceError;

      const totalAttendanceRecords = attendanceData?.length || 0;
      const presentRecords = attendanceData?.filter(a => a.is_present).length || 0;
      const attendancePercentage = totalAttendanceRecords > 0 
        ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
        : 0;

      // 2. Calcular média de notas (averageGrade)
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('value, max_value')
        .in('subject_id', subjectIds.length > 0 ? subjectIds : ['00000000-0000-0000-0000-000000000000']);

      if (gradesError) throw gradesError;

      let averageGrade = 0;
      if (gradesData && gradesData.length > 0) {
        const totalGrade = gradesData.reduce((sum, grade) => {
          const normalizedGrade = (Number(grade.value) / Number(grade.max_value)) * 10;
          return sum + normalizedGrade;
        }, 0);
        averageGrade = parseFloat((totalGrade / gradesData.length).toFixed(1));
      }

      // 3. Calcular alunos evadidos nas disciplinas do instrutor (evadedStudents)
      // Primeiro, buscar todos os alunos das turmas do instrutor
      const { data: studentProfiles, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);

      if (studentsError) throw studentsError;

      const studentIds = studentProfiles?.map(s => s.id) || [];

      // Buscar evasões ativas desses alunos
      const { count: evadedCount, error: evasionsError } = await supabase
        .from('evasions')
        .select('student_id', { count: 'exact', head: true })
        .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('status', 'active');

      if (evasionsError) throw evasionsError;

      setStats({
        myClasses,
        attendancePercentage,
        averageGrade,
        evadedStudents: evadedCount || 0
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching instructor stats:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas do instrutor."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'instructor') {
      fetchInstructorStats();
    }
  }, [profile]);

  return {
    stats,
    loading,
    error,
    refetch: fetchInstructorStats
  };
};