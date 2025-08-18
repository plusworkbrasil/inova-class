import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Communication {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string[];
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  type: string;
  attachments?: string[];
}

export const useApiCommunications = () => {
  const [data, setData] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);

      const communications = await apiClient.get('communications');
      setData(communications || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching communications:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCommunication = async (communication: Omit<Communication, 'id' | 'created_at' | 'updated_at' | 'author_id' | 'type' | 'attachments' | 'published_at'>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const data = await apiClient.create('communications', {
        ...communication,
        author_id: user.id,
        type: 'announcement',
        published_at: communication.is_published ? new Date().toISOString() : null
      });

      await fetchCommunications();
      
      toast({
        title: "Sucesso!",
        description: "Comunicação criada com sucesso."
      });

      return data;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar comunicação."
      });
      throw err;
    }
  };

  const updateCommunication = async (id: string, updates: Partial<Communication>) => {
    try {
      const updateData = { ...updates };
      
      // Se está sendo publicada, define a data de publicação
      if (updates.is_published && !updates.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      await apiClient.update('communications', id, updateData);
      await fetchCommunications();
      
      toast({
        title: "Sucesso!",
        description: "Comunicação atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar comunicação."
      });
      throw err;
    }
  };

  const deleteCommunication = async (id: string) => {
    try {
      await apiClient.delete('communications', id);
      await fetchCommunications();
      
      toast({
        title: "Sucesso!",
        description: "Comunicação excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir comunicação."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchCommunications,
    createCommunication,
    updateCommunication,
    deleteCommunication
  };
};