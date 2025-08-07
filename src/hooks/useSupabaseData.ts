import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseData = (
  table: string,
  query?: string,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: result, error: fetchError } = await supabase
        .from(table as any)
        .select(query || '*');
      
      if (fetchError) throw fetchError;
      
      setData(result || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (record: any) => {
    try {
      const { data: newRecord, error } = await supabase
        .from(table as any)
        .insert([record])
        .select()
        .single();

      if (error) throw error;

      setData(prev => [newRecord, ...prev]);
      toast({
        title: "Registro criado com sucesso!",
        description: "O novo registro foi adicionado.",
      });
      
      return newRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar registro';
      toast({
        title: "Erro ao criar registro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateRecord = async (id: string, updates: any) => {
    try {
      const { data: updatedRecord, error } = await supabase
        .from(table as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => 
        item.id === id ? updatedRecord : item
      ));
      
      toast({
        title: "Registro atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      
      return updatedRecord;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar registro';
      toast({
        title: "Erro ao atualizar registro",
        description: errorMessage,
        variant: "destructive",
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

      setData(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Registro excluído",
        description: "O registro foi removido do sistema.",
        variant: "destructive",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir registro';
      toast({
        title: "Erro ao excluir registro",
        description: errorMessage,
        variant: "destructive",
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
    deleteRecord,
  };
};