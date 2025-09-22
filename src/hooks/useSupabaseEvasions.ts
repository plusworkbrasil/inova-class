import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Evasion {
  id: string;
  student_id: string;
  date: string;
  reported_by: string;
  reason: string;
  status: string;
  observations?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    class_id: string;
  };
}

export const useSupabaseEvasions = () => {
  const [data, setData] = useState<Evasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvasions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: evasions, error } = await supabase
        .from('evasions')
        .select(`
          *,
          profiles!evasions_student_id_fkey(name, class_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(evasions || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching evasions:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar evasões."
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvasion = async (evasionData: Omit<Evasion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .insert([evasionData]);

      if (error) throw error;

      await fetchEvasions();
      toast({
        title: "Sucesso!",
        description: "Evasão registrada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao registrar evasão."
      });
      throw err;
    }
  };

  const updateEvasion = async (id: string, updates: Partial<Evasion>) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchEvasions();
      toast({
        title: "Sucesso!",
        description: "Evasão atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar evasão."
      });
      throw err;
    }
  };

  const deleteEvasion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEvasions();
      toast({
        title: "Sucesso!",
        description: "Evasão excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir evasão."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEvasions();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchEvasions,
    createEvasion,
    updateEvasion,
    deleteEvasion
  };
};