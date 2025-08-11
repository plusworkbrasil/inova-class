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

      let queryBuilder = (supabase as any).from(table).select('*');
      
      if (query) {
        // Parse basic query parameters
        const params = new URLSearchParams(query);
        for (const [key, value] of params.entries()) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }

      const { data: result, error } = await queryBuilder;

      if (error) throw error;

      setData(result || []);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (record: any) => {
    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .insert(record)
        .select()
        .single();

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Sucesso!",
        description: "Registro criado com sucesso."
      });

      return data;
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
      const { error } = await (supabase as any)
        .from(table)
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
      const { error } = await (supabase as any)
        .from(table)
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