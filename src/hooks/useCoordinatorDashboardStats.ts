import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CoordinatorDashboardStats {
  totalClasses: number;
  totalInstructors: number;
  averageAttendance: number;
  totalCommunications: number;
  activeEvasions: number;
  pendingReports: number;
}

export const useCoordinatorDashboardStats = () => {
  const [stats, setStats] = useState<CoordinatorDashboardStats>({
    totalClasses: 0,
    totalInstructors: 0,
    averageAttendance: 0,
    totalCommunications: 0,
    activeEvasions: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchCoordinatorStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar total de turmas
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id');

      if (classesError) throw classesError;

      // Buscar total de instrutores - using user_roles table
      const { data: instructorRoles, error: instructorsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'instructor');

      if (instructorsError) throw instructorsError;
      
      const instructors = instructorRoles || [];

      // Calcular frequência média
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('is_present');

      if (attendanceError) throw attendanceError;

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.is_present).length || 0;
      const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Buscar comunicações do coordenador
      const { data: communications, error: communicationsError } = await supabase
        .from('communications')
        .select('id')
        .eq('author_id', profile.id);

      if (communicationsError) throw communicationsError;

      // Buscar evasões ativas
      const { data: evasions, error: evasionsError } = await supabase
        .from('evasions')
        .select('id')
        .eq('status', 'active');

      if (evasionsError) throw evasionsError;

      // Buscar declarações pendentes (como relatórios)
      const { data: declarations, error: declarationsError } = await supabase
        .from('declarations')
        .select('id')
        .eq('status', 'pending');

      if (declarationsError) throw declarationsError;

      setStats({
        totalClasses: classes?.length || 0,
        totalInstructors: instructors?.length || 0,
        averageAttendance,
        totalCommunications: communications?.length || 0,
        activeEvasions: evasions?.length || 0,
        pendingReports: declarations?.length || 0
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching coordinator stats:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas do coordenador."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'coordinator') {
      fetchCoordinatorStats();
    }
  }, [profile]);

  return {
    stats,
    loading,
    error,
    refetch: fetchCoordinatorStats
  };
};