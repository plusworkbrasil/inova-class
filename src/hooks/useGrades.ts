import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  value: number;
  max_value: number;
  date: string;
  teacher_id: string;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export const useGrades = () => {
  const [data, setData] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: grades, error } = await supabase
        .from('grades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(grades || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching grades:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGrade = async (grade: Omit<Grade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .insert(grade)
        .select()
        .single();

      if (error) throw error;

      await fetchGrades();
      
      toast({
        title: "Sucesso!",
        description: "Nota criada com sucesso."
      });

      return data;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar nota."
      });
      throw err;
    }
  };

  const updateGrade = async (id: string, updates: Partial<Grade>) => {
    try {
      const { error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchGrades();
      
      toast({
        title: "Sucesso!",
        description: "Nota atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar nota."
      });
      throw err;
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGrades();
      
      toast({
        title: "Sucesso!",
        description: "Nota excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir nota."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchGrades,
    createGrade,
    updateGrade,
    deleteGrade
  };
};