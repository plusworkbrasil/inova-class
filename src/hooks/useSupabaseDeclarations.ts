import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Declaration {
  id: string;
  student_id: string;
  type: string;
  title: string;
  description?: string;
  purpose?: string;
  urgency: string;
  status: string;
  subject_id?: string;
  file_path?: string;
  observations?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseDeclarations = () => {
  const [data, setData] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDeclarations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: declarations, error } = await supabase
        .from('declarations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(declarations || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching declarations:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar declarações."
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeclaration = async (declarationData: Omit<Declaration, 'id' | 'created_at' | 'updated_at' | 'requested_at'>) => {
    try {
      const dataToInsert = {
        ...declarationData,
        requested_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('declarations')
        .insert([dataToInsert]);

      if (error) throw error;

      await fetchDeclarations();
      toast({
        title: "Sucesso!",
        description: "Declaração solicitada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao solicitar declaração."
      });
      throw err;
    }
  };

  const updateDeclaration = async (id: string, updates: Partial<Declaration>) => {
    try {
      const { error } = await supabase
        .from('declarations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchDeclarations();
      toast({
        title: "Sucesso!",
        description: "Declaração atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar declaração."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDeclarations,
    createDeclaration,
    updateDeclaration
  };
};