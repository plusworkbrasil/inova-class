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
  observations?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student_name?: string;
  student_enrollment?: string;
  student_number?: string;
}

export const useSupabaseGrades = () => {
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
        .select(`
          *,
          profiles:student_id(name, enrollment_number, student_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include joined fields
      const transformedData = (grades || []).map((record: any) => ({
        ...record,
        student_name: record.profiles?.name,
        student_enrollment: record.profiles?.enrollment_number,
        student_number: record.profiles?.student_id
      }));
      
      setData(transformedData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching grades:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar notas."
      });
    } finally {
      setLoading(false);
    }
  };

  const createGrade = async (gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Hook createGrade - dados recebidos:', gradeData);
      
      // Validar dados antes de enviar
      if (!gradeData.student_id || !gradeData.subject_id || !gradeData.teacher_id) {
        throw new Error('Dados obrigatórios ausentes: student_id, subject_id ou teacher_id');
      }

      const { data, error } = await supabase
        .from('grades')
        .insert([gradeData])
        .select();

      console.log('Resultado da inserção:', { data, error });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      await fetchGrades();
      console.log('Nota criada com sucesso');
      
      toast({
        title: "Sucesso!",
        description: "Nota lançada com sucesso."
      });
    } catch (err: any) {
      console.error('Erro completo no createGrade:', err);
      const errorMessage = err?.message || err?.error_description || "Erro desconhecido ao lançar nota.";
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage
      });
      throw err;
    }
  };

  const createBatchGrades = async (gradesData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      console.log('Hook createBatchGrades - dados recebidos:', gradesData);
      
      // Validar dados antes de enviar
      if (!gradesData.length) {
        throw new Error('Nenhuma nota para inserir');
      }

      const { data, error } = await supabase
        .from('grades')
        .insert(gradesData)
        .select();

      console.log('Resultado da inserção em lote:', { data, error });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      await fetchGrades();
      console.log('Notas criadas com sucesso em lote');
      
      toast({
        title: "Sucesso!",
        description: `${gradesData.length} notas lançadas com sucesso.`
      });

      return data;
    } catch (err: any) {
      console.error('Erro completo no createBatchGrades:', err);
      const errorMessage = err?.message || err?.error_description || "Erro desconhecido ao lançar notas em lote.";
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage
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
      // Buscar dados da nota antes de excluir para auditoria
      const { data: gradeData } = await supabase
        .from('grades')
        .select('student_id, subject_id, value, type')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user && gradeData) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'DELETE',
          table_name: 'grades',
          record_id: id,
          accessed_fields: ['student_id', 'subject_id', 'value', 'type']
        });
      }

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
    createBatchGrades,
    updateGrade,
    deleteGrade
  };
};