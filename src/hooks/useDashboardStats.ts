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

      console.log('🔍 [useDashboardStats] Iniciando busca de estatísticas...');

      // Verificar se há sessão ativa antes de buscar dados
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ [useDashboardStats] Sessão inválida ou expirada');
        setLoading(false);
        return;
      }
      
      console.log('✅ [useDashboardStats] Sessão válida:', session.user.email);

      // Verificar role do usuário atual
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      console.log('🔒 [useDashboardStats] User role:', roleData?.role);

      // Só executar queries amplas se for admin/secretary
      if (roleData?.role !== 'admin' && roleData?.role !== 'secretary') {
        console.warn('⚠️ [useDashboardStats] Este hook deve ser usado apenas por admin/secretary');
        console.warn('⚠️ [useDashboardStats] Role atual:', roleData?.role);
        setLoading(false);
        return;
      }

      console.log('✅ [useDashboardStats] Role válido, buscando dados...');

      let totalUsers = 0;
      let totalStudents = 0;
      let totalTeachers = 0;
      let totalClasses = 0;
      let totalSubjects = 0;
      let totalDeclarations = 0;
      let pendingDeclarations = 0;
      let attendanceRate = '0%';

      // Buscar total de usuários
      console.log('🔍 [useDashboardStats] Buscando total de usuários...');
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (!error) {
          totalUsers = count || 0;
          console.log(`✅ [useDashboardStats] Total usuários: ${totalUsers}`);
        } else {
          console.error('❌ [useDashboardStats] Erro ao buscar usuários:', error.message, error.code);
        }
      } catch (err: any) {
        console.error('❌ [useDashboardStats] Erro ao buscar usuários:', err.message);
      }

      // Buscar total de estudantes (profiles com class_id)
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('class_id', 'is', null);
        if (!error) totalStudents = count || 0;
        else console.warn('Erro ao buscar estudantes:', error);
      } catch (err) {
        console.warn('Erro ao buscar estudantes:', err);
      }

      // Buscar total de professores/instrutores (teacher_id únicos em subjects)
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('teacher_id')
          .not('teacher_id', 'is', null);
        if (!error && data) {
          const uniqueTeachers = new Set(data.map(s => s.teacher_id));
          totalTeachers = uniqueTeachers.size;
        } else {
          console.warn('Erro ao buscar professores:', error);
        }
      } catch (err) {
        console.warn('Erro ao buscar professores:', err);
      }

      // Buscar total de turmas
      console.log('🔍 [useDashboardStats] Buscando turmas...');
      try {
        const { count, error } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });
        if (!error) {
          totalClasses = count || 0;
          console.log(`✅ [useDashboardStats] Total turmas: ${totalClasses}`);
        } else {
          console.error('❌ [useDashboardStats] Erro ao buscar turmas:', error.message, error.code);
        }
      } catch (err: any) {
        console.error('❌ [useDashboardStats] Erro ao buscar turmas:', err.message);
      }

      // Buscar total de disciplinas
      try {
        const { count, error } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true });
        if (!error) totalSubjects = count || 0;
        else console.warn('Erro ao buscar disciplinas:', error);
      } catch (err) {
        console.warn('Erro ao buscar disciplinas:', err);
      }

      // Buscar total de declarações
      try {
        const { count, error } = await supabase
          .from('declarations')
          .select('*', { count: 'exact', head: true });
        if (!error) totalDeclarations = count || 0;
        else console.warn('Erro ao buscar declarações:', error);
      } catch (err) {
        console.warn('Erro ao buscar declarações:', err);
      }

      // Buscar declarações pendentes
      try {
        const { count, error } = await supabase
          .from('declarations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (!error) pendingDeclarations = count || 0;
        else console.warn('Erro ao buscar declarações pendentes:', error);
      } catch (err) {
        console.warn('Erro ao buscar declarações pendentes:', err);
      }

      // Calcular frequência real dos alunos
      if (totalStudents > 0) {
        try {
          const { count: totalAttendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true });

          const { count: presentCount, error: presentError } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('is_present', true);

          if (!attendanceError && !presentError && totalAttendance && totalAttendance > 0) {
            const rate = ((presentCount || 0) / totalAttendance) * 100;
            attendanceRate = `${rate.toFixed(1)}%`;
          } else {
            console.warn('Erro ao calcular frequência:', attendanceError || presentError);
            attendanceRate = 'N/A';
          }
        } catch (err) {
          console.warn('Erro ao calcular frequência:', err);
          attendanceRate = 'N/A';
        }
      }

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalDeclarations,
        pendingDeclarations,
        attendanceRate,
      });
    } catch (err: any) {
      console.warn('Error fetching dashboard stats:', err);
      
      // Detectar erros de autenticação e limpar sessão
      if (err?.code === 'PGRST301' || err?.message?.includes('JWT') || err?.message?.includes('session')) {
        console.warn('Auth error detected, clearing session');
        await supabase.auth.signOut();
      }
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