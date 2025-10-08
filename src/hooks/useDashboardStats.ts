import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalDeclarations: number;
  pendingDeclarations: number;
  attendanceRate: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalDeclarations: 0,
    pendingDeclarations: 0,
    attendanceRate: '0%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar total de usuários
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Buscar total de estudantes
      const { count: totalStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Buscar total de professores/instrutores
      const { count: totalTeachers, error: teachersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['teacher', 'instructor']);

      if (teachersError) throw teachersError;

      // Buscar total de turmas
      const { count: totalClasses, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      if (classesError) throw classesError;

      // Buscar total de disciplinas
      const { count: totalSubjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      if (subjectsError) throw subjectsError;

      // Buscar total de declarações
      const { count: totalDeclarations, error: declarationsError } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true });

      if (declarationsError) throw declarationsError;

      // Buscar declarações pendentes
      const { count: pendingDeclarations, error: pendingError } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Calcular frequência real dos alunos
      let attendanceRate = '0%';
      if (totalStudents && totalStudents > 0) {
        // Buscar total de registros de presença
        const { count: totalAttendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true });

        // Buscar total de presenças (is_present = true)
        const { count: presentCount, error: presentError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('is_present', true);

        if (attendanceError || presentError) {
          console.warn('Erro ao calcular frequência:', attendanceError || presentError);
          attendanceRate = 'N/A';
        } else if (totalAttendance && totalAttendance > 0) {
          const rate = ((presentCount || 0) / totalAttendance) * 100;
          attendanceRate = `${rate.toFixed(1)}%`;
        }
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalClasses: totalClasses || 0,
        totalSubjects: totalSubjects || 0,
        totalDeclarations: totalDeclarations || 0,
        pendingDeclarations: pendingDeclarations || 0,
        attendanceRate,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard stats:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas do dashboard."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};