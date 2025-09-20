import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Evasion {
  id: string;
  student_id: string;
  date: string;
  reason: string;
  reported_by: string;
  status: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export const useEvasions = () => {
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(evasions || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching evasions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvasion = async (evasion: Omit<Evasion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('evasions')
        .insert(evasion)
        .select()
        .single();

      if (error) throw error;

      await fetchEvasions();
      
      toast({
        title: "Sucesso!",
        description: "Evasão registrada com sucesso."
      });

      return data;
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
        description: "Registro de evasão excluído com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir registro de evasão."
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