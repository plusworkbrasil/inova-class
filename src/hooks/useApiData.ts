import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useApiData = (
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
      
      const result = await apiClient.fetchTable(table, query);
      setData(Array.isArray(result) ? result : []);
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
      const newRecord = await apiClient.createRecord(table, record);
      
      if (newRecord && newRecord.success) {
        await fetchData(); // Recarregar dados
        toast({
          title: "Registro criado com sucesso!",
          description: "O novo registro foi adicionado.",
        });
      }
      
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
      const updatedRecord = await apiClient.updateRecord(table, id, updates);
      
      if (updatedRecord && updatedRecord.success) {
        await fetchData(); // Recarregar dados
        toast({
          title: "Registro atualizado com sucesso!",
          description: "As alterações foram salvas.",
        });
      }
      
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
      const result = await apiClient.deleteRecord(table, id);
      
      if (result && result.success) {
        await fetchData(); // Recarregar dados
        toast({
          title: "Registro excluído",
          description: "O registro foi removido do sistema.",
          variant: "destructive",
        });
      }
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