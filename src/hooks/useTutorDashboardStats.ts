import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TutorDashboardStats {
  totalStudents: number;
  activeClasses: number;
  totalDeclarations: number;
  attendanceRate: number;
  activeSubjects: number;
  recentEvasions: number;
  absencesByClass: {
    className: string;
    totalAbsences: number;
  }[];
}

export const useTutorDashboardStats = () => {
  const [stats, setStats] = useState<TutorDashboardStats>({
    totalStudents: 0,
    activeClasses: 0,
    totalDeclarations: 0,
    attendanceRate: 0,
    activeSubjects: 0,
    recentEvasions: 0,
    absencesByClass: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchTutorStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Total de Alunos (profiles com class_id)
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .not('class_id', 'is', null);

      if (studentsError) throw studentsError;

      // 2. Turmas Ativas
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id');

      if (classesError) throw classesError;

      // 3. Total de Declarações
      const { data: declarations, error: declarationsError } = await supabase
        .from('declarations')
        .select('id');

      if (declarationsError) throw declarationsError;

      // 4. Taxa de Frequência (%)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('is_present');

      if (attendanceError) throw attendanceError;

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.is_present).length || 0;
      const attendanceRate = totalAttendance > 0 
        ? Math.round((presentCount / totalAttendance) * 100) 
        : 0;

      // 5. Disciplinas Ativas (status = 'ativo')
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id')
        .eq('status', 'ativo');

      if (subjectsError) throw subjectsError;

      // 6. Evasões Recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: evasions, error: evasionsError } = await supabase
        .from('evasions')
        .select('id')
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (evasionsError) throw evasionsError;

      // 7. Gráfico de Faltas por Turma
      const { data: absencesData, error: absencesError } = await supabase
        .from('attendance')
        .select(`
          class_id,
          is_present,
          classes!inner(name)
        `)
        .eq('is_present', false);

      if (absencesError) throw absencesError;

      // Agrupar faltas por turma
      const absencesByClass: { [key: string]: { name: string; count: number } } = {};
      
      absencesData?.forEach((record: any) => {
        const className = record.classes?.name || 'Sem Turma';
        if (!absencesByClass[className]) {
          absencesByClass[className] = { name: className, count: 0 };
        }
        absencesByClass[className].count++;
      });

      const absencesArray = Object.values(absencesByClass)
        .map(item => ({
          className: item.name,
          totalAbsences: item.count
        }))
        .sort((a, b) => b.totalAbsences - a.totalAbsences)
        .slice(0, 5); // Top 5 turmas com mais faltas

      setStats({
        totalStudents: students?.length || 0,
        activeClasses: classes?.length || 0,
        totalDeclarations: declarations?.length || 0,
        attendanceRate,
        activeSubjects: subjects?.length || 0,
        recentEvasions: evasions?.length || 0,
        absencesByClass: absencesArray
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tutor stats:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas do tutor."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchTutorStats();
    }
  }, [profile?.id]);

  return {
    stats,
    loading,
    error,
    refetch: fetchTutorStats
  };
};
