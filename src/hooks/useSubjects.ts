import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Subject {
  id: string;
  name: string;
  teacher_id?: string;
  class_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useSubjects = () => {
  const [data, setData] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(subjects || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();

      if (error) throw error;

      await fetchSubjects();
      
      toast({
        title: "Sucesso!",
        description: "Matéria criada com sucesso."
      });

      return data;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar matéria."
      });
      throw err;
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchSubjects();
      
      toast({
        title: "Sucesso!",
        description: "Matéria atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar matéria."
      });
      throw err;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSubjects();
      
      toast({
        title: "Sucesso!",
        description: "Matéria excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir matéria."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject
  };
};