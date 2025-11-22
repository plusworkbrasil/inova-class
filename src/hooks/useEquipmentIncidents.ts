import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface EquipmentIncident {
  id: string;
  equipment_id: string;
  allocation_id?: string;
  reported_by: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  title: string;
  description: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  status: 'aberto' | 'em_analise' | 'resolvido' | 'fechado';
  created_at: string;
  updated_at: string;
  equipment?: {
    name: string;
    patrimonio?: string;
  };
  reporter?: {
    name: string;
  };
  resolver?: {
    name: string;
  };
}

export const useEquipmentIncidents = (equipmentId?: string) => {
  const [data, setData] = useState<EquipmentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('equipment_incidents')
        .select(`
          *,
          equipment:equipment_id (name, patrimonio),
          reporter:reported_by (name),
          resolver:resolved_by (name)
        `)
        .order('created_at', { ascending: false });

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data: incidents, error } = await query;

      if (error) throw error;
      setData((incidents as any) || []);
    } catch (err: any) {
      console.error('Error fetching incidents:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar ocorrências."
      });
    } finally {
      setLoading(false);
    }
  };

  const createIncident = async (incidentData: {
    equipment_id: string;
    allocation_id?: string;
    severity: 'baixa' | 'media' | 'alta' | 'critica';
    title: string;
    description: string;
  }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('equipment_incidents')
        .insert([{
          ...incidentData,
          reported_by: user.user.id,
          status: 'aberto'
        }]);

      if (error) throw error;

      await fetchIncidents();
      toast({
        title: "Sucesso!",
        description: "Ocorrência registrada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao registrar ocorrência."
      });
      throw err;
    }
  };

  const resolveIncident = async (id: string, resolution: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('equipment_incidents')
        .update({
          status: 'resolvido',
          resolution,
          resolved_by: user.user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchIncidents();
      toast({
        title: "Sucesso!",
        description: "Ocorrência resolvida com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao resolver ocorrência."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [equipmentId]);

  return {
    data,
    loading,
    refetch: fetchIncidents,
    createIncident,
    resolveIncident
  };
};
