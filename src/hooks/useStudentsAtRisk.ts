import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateRiskScore, RiskIndicators } from '@/lib/riskCalculation';
import { format, subDays } from 'date-fns';

export interface StudentAtRisk {
  id: string;
  student_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  identified_at: string;
  status: 'active' | 'monitoring' | 'resolved' | 'evaded';
  identified_by: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  attendance_percentage: number | null;
  grade_average: number | null;
  absences_last_30_days: number | null;
  missed_activities: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    name: string;
    email: string;
    class_id: string | null;
    student_id: string | null;
  };
  student_class?: {
    id: string;
    name: string;
  };
  identifier?: {
    name: string;
  };
  assignee?: {
    name: string;
  };
  interventions_count?: number;
  last_intervention?: string | null;
}

export interface StudentRiskData {
  studentId: string;
  studentName: string;
  className: string | null;
  classId: string | null;
  indicators: RiskIndicators;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export const useStudentsAtRisk = () => {
  const [data, setData] = useState<StudentAtRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudentsAtRisk = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: riskRecords, error: fetchError } = await supabase
        .from('students_at_risk')
        .select(`
          *,
          student:profiles!students_at_risk_student_id_fkey(id, name, email, class_id, student_id),
          identifier:profiles!students_at_risk_identified_by_fkey(name),
          assignee:profiles!students_at_risk_assigned_to_fkey(name)
        `)
        .order('risk_score', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch class names for each student
      const recordsWithClasses = await Promise.all(
        (riskRecords || []).map(async (record) => {
          let student_class = null;
          if (record.student?.class_id) {
            const { data: classData } = await supabase
              .from('classes')
              .select('id, name')
              .eq('id', record.student.class_id)
              .maybeSingle();
            student_class = classData;
          }

          // Count interventions
          const { count } = await supabase
            .from('risk_interventions')
            .select('*', { count: 'exact', head: true })
            .eq('risk_record_id', record.id);

          // Get last intervention date
          const { data: lastIntervention } = await supabase
            .from('risk_interventions')
            .select('performed_at')
            .eq('risk_record_id', record.id)
            .order('performed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...record,
            risk_level: record.risk_level as 'low' | 'medium' | 'high' | 'critical',
            status: record.status as 'active' | 'monitoring' | 'resolved' | 'evaded',
            student_class,
            interventions_count: count || 0,
            last_intervention: lastIntervention?.performed_at || null
          };
        })
      );

      setData(recordsWithClasses as StudentAtRisk[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching students at risk:', err);
      setError(err as Error);
      toast.error('Erro ao carregar alunos em risco');
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeStudentRisk = async (studentId: string): Promise<StudentRiskData | null> => {
    try {
      // Fetch student profile
      const { data: student } = await supabase
        .from('profiles')
        .select('id, name, class_id')
        .eq('id', studentId)
        .maybeSingle();

      if (!student) return null;

      // Get class name
      let className = null;
      if (student.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', student.class_id)
          .maybeSingle();
        className = classData?.name || null;
      }

      // Calculate attendance percentage
      const { data: attendance } = await supabase
        .from('attendance')
        .select('is_present')
        .eq('student_id', studentId);

      const totalAttendance = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.is_present).length || 0;
      const attendancePercentage = totalAttendance > 0 
        ? (presentCount / totalAttendance) * 100 
        : 100;

      // Calculate grade average
      const { data: grades } = await supabase
        .from('grades')
        .select('value, max_value')
        .eq('student_id', studentId);

      const gradeAverage = grades && grades.length > 0
        ? grades.reduce((sum, g) => sum + (g.value / g.max_value * 10), 0) / grades.length
        : 10;

      // Count absences in last 30 days
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: recentAbsences } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('is_present', false)
        .gte('date', thirtyDaysAgo);

      const absencesLast30Days = recentAbsences?.length || 0;

      const indicators: RiskIndicators = {
        attendancePercentage,
        gradeAverage,
        absencesLast30Days,
        missedActivities: 0
      };

      const riskResult = calculateRiskScore(indicators);

      return {
        studentId,
        studentName: student.name,
        className,
        classId: student.class_id,
        indicators,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        factors: riskResult.factors
      };
    } catch (err) {
      console.error('Error analyzing student risk:', err);
      return null;
    }
  };

  const createRiskRecord = async (
    studentId: string,
    riskData: StudentRiskData,
    assignedTo?: string
  ): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const { error: insertError } = await supabase
        .from('students_at_risk')
        .insert({
          student_id: studentId,
          risk_level: riskData.riskLevel,
          risk_score: riskData.riskScore,
          identified_by: user.user.id,
          assigned_to: assignedTo || null,
          attendance_percentage: riskData.indicators.attendancePercentage,
          grade_average: riskData.indicators.gradeAverage,
          absences_last_30_days: riskData.indicators.absencesLast30Days,
          missed_activities: riskData.indicators.missedActivities
        });

      if (insertError) throw insertError;

      toast.success('Aluno adicionado ao acompanhamento de risco');
      await fetchStudentsAtRisk();
      return true;
    } catch (err) {
      console.error('Error creating risk record:', err);
      toast.error('Erro ao criar registro de risco');
      return false;
    }
  };

  const updateRiskRecord = async (
    id: string,
    updates: Partial<StudentAtRisk>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('students_at_risk')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Registro atualizado');
      await fetchStudentsAtRisk();
      return true;
    } catch (err) {
      console.error('Error updating risk record:', err);
      toast.error('Erro ao atualizar registro');
      return false;
    }
  };

  const resolveRiskRecord = async (
    id: string,
    status: 'resolved' | 'evaded',
    notes: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('students_at_risk')
        .update({
          status,
          resolution_notes: notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success(status === 'resolved' ? 'Caso resolvido com sucesso' : 'Status atualizado para evadido');
      await fetchStudentsAtRisk();
      return true;
    } catch (err) {
      console.error('Error resolving risk record:', err);
      toast.error('Erro ao atualizar status');
      return false;
    }
  };

  useEffect(() => {
    fetchStudentsAtRisk();
  }, [fetchStudentsAtRisk]);

  return {
    data,
    loading,
    error,
    refetch: fetchStudentsAtRisk,
    analyzeStudentRisk,
    createRiskRecord,
    updateRiskRecord,
    resolveRiskRecord
  };
};
