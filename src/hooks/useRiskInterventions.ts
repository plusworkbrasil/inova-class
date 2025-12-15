import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RiskIntervention {
  id: string;
  risk_record_id: string;
  student_id: string;
  intervention_type: 'phone_call' | 'meeting' | 'family_contact' | 'academic_support' | 'psychological_support' | 'financial_support' | 'home_visit' | 'other';
  description: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'pending' | null;
  performed_by: string;
  performed_at: string;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  created_at: string;
  // Joined data
  performer?: {
    name: string;
  };
}

export interface CreateInterventionData {
  risk_record_id: string;
  student_id: string;
  intervention_type: RiskIntervention['intervention_type'];
  description: string;
  outcome?: RiskIntervention['outcome'];
  follow_up_date?: string;
  follow_up_notes?: string;
}

export const useRiskInterventions = (riskRecordId?: string) => {
  const [data, setData] = useState<RiskIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInterventions = useCallback(async () => {
    if (!riskRecordId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: interventions, error: fetchError } = await supabase
        .from('risk_interventions')
        .select(`
          *,
          performer:profiles!risk_interventions_performed_by_fkey(name)
        `)
        .eq('risk_record_id', riskRecordId)
        .order('performed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setData((interventions || []) as RiskIntervention[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [riskRecordId]);

  const createIntervention = async (interventionData: CreateInterventionData): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const { error: insertError } = await supabase
        .from('risk_interventions')
        .insert({
          ...interventionData,
          performed_by: user.user.id,
          outcome: interventionData.outcome || 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Intervenção registrada com sucesso');
      await fetchInterventions();
      return true;
    } catch (err) {
      console.error('Error creating intervention:', err);
      toast.error('Erro ao registrar intervenção');
      return false;
    }
  };

  const updateIntervention = async (
    id: string,
    updates: Partial<RiskIntervention>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('risk_interventions')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Intervenção atualizada');
      await fetchInterventions();
      return true;
    } catch (err) {
      console.error('Error updating intervention:', err);
      toast.error('Erro ao atualizar intervenção');
      return false;
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  return {
    data,
    loading,
    error,
    refetch: fetchInterventions,
    createIntervention,
    updateIntervention
  };
};
