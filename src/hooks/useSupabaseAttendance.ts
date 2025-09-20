import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  date: string;
  is_present: boolean;
  justification?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseAttendance = () => {
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(attendance || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching attendance:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar frequência."
      });
    } finally {
      setLoading(false);
    }
  };

  const createAttendance = async (attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([attendanceData]);

      if (error) throw error;

      await fetchAttendance();
      toast({
        title: "Sucesso!",
        description: "Frequência registrada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao registrar frequência."
      });
      throw err;
    }
  };

  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchAttendance();
      toast({
        title: "Sucesso!",
        description: "Frequência atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar frequência."
      });
      throw err;
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAttendance();
      toast({
        title: "Sucesso!",
        description: "Registro de frequência excluído com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir frequência."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance
  };
};