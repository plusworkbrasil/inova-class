import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useSupabaseData = (table: string, query?: string, dependencies: any[] = []) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let supabaseQuery = supabase.from(table as any).select(query || '*');
      
      const { data: result, error } = await supabaseQuery;
      
      if (error) throw error;
      
      setData(result || []);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error fetching ${table}:`, err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar ${table}.`
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (record: any) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .insert([record]);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Sucesso!",
        description: "Registro criado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar registro."
      });
      throw err;
    }
  };

  const updateRecord = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Sucesso!",
        description: "Registro atualizado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar registro."
      });
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Sucesso!",
        description: "Registro excluído com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir registro."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createRecord,
    updateRecord,
    deleteRecord
  };
};