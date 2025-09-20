import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  teacher_id?: string;
  class_id?: string;
  workload?: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseSubjects = () => {
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar disciplinas."
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([subjectData]);

      if (error) throw error;

      await fetchSubjects();
      toast({
        title: "Sucesso!",
        description: "Disciplina criada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar disciplina."
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
        description: "Disciplina atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar disciplina."
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
        description: "Disciplina excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir disciplina."
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