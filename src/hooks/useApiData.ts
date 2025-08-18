import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from './use-toast';

export const useApiData = (table: string, dependencies: any[] = []) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get(table);
      setData(Array.isArray(result) ? result : [result]);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (record: any) => {
    try {
      await apiClient.create(table, record);
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
      await apiClient.update(table, id, updates);
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
      await apiClient.delete(table, id);
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