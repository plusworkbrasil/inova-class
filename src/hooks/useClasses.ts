import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Class {
  id: string;
  name: string;
  grade: string;
  year: number;
  teacher_id?: string;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const useClasses = () => {
  const [data, setData] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(classes || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .maybeSingle();

      if (error) throw error;

      await fetchClasses();
      
      toast({
        title: "Sucesso!",
        description: "Turma criada com sucesso."
      });

      return data;
    } catch (err: any) {
      console.error('Error creating class:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar turma."
      });
      throw err;
    }
  };

  const updateClass = async (id: string, updates: Partial<Class>) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchClasses();
      
      toast({
        title: "Sucesso!",
        description: "Turma atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar turma."
      });
      throw err;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchClasses();
      
      toast({
        title: "Sucesso!",
        description: "Turma excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir turma."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchClasses,
    createClass,
    updateClass,
    deleteClass
  };
};