import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export const useCommunications = () => {
  const [data, setData] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: communications, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      const { data, error } = await supabase
        .from('communications')
        .insert({
          ...communication,
          author_id: user.id,
          type: 'announcement',
          published_at: communication.is_published ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

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

      const { error } = await supabase
        .from('communications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', id);

      if (error) throw error;

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