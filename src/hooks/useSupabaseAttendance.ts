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
  daily_activity?: string;
  // Joined data
  student_name?: string;
  student_enrollment?: string;
  student_number?: string;
  class_name?: string;
  subject_name?: string;
  is_evaded?: boolean; // Indica se o aluno está evadido
  student_status?: string; // Status do aluno no perfil
}

export interface GroupedAttendance {
  date: string;
  subject_id: string;
  subject_name?: string;
  class_id: string;
  class_name?: string;
  daily_activity?: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  records: Attendance[];
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
        .select(`
          *,
          profiles:student_id(name, enrollment_number, student_id, status),
          classes:class_id(name),
          subjects:subject_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar evasões ativas
      const { data: evasionsData } = await supabase
        .from('evasions')
        .select('student_id')
        .eq('status', 'active');

      const evadedStudentIds = new Set(evasionsData?.map(e => e.student_id) || []);
      
      // Transform the data to include joined fields
      const transformedData = (attendance || []).map((record: any) => {
        const isEvaded = evadedStudentIds.has(record.student_id) || record.profiles?.status === 'inactive';
        return {
          ...record,
          student_name: record.profiles?.name,
          student_enrollment: record.profiles?.enrollment_number,
          student_number: record.profiles?.student_id,
          class_name: record.classes?.name,
          subject_name: record.subjects?.name,
          is_evaded: isEvaded,
          student_status: record.profiles?.status
        };
      });
      
      setData(transformedData);
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
      console.log('🔍 Tentando criar attendance:', attendanceData);
      
      const { error } = await supabase
        .from('attendance')
        .insert([attendanceData]);

      if (error) {
        console.error('❌ Erro RLS/SQL:', error);
        throw error;
      }

      console.log('✅ Attendance criado com sucesso');
      await fetchAttendance();
      
      toast({
        title: "Sucesso!",
        description: "Frequência registrada com sucesso."
      });
    } catch (err: any) {
      console.error('❌ Erro completo:', err);
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
      // Buscar dados antes de excluir para auditoria
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, class_id, subject_id, date, is_present')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Registrar auditoria
      const { data: { user } } = await supabase.auth.getUser();
      if (user && attendanceData) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'DELETE',
          table_name: 'attendance',
          record_id: id,
          accessed_fields: ['student_id', 'class_id', 'subject_id', 'date', 'is_present']
        });
      }

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

  const createBatchAttendance = async (
    attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[],
    dailyActivity?: string
  ) => {
    try {
      const recordsWithActivity = attendanceRecords.map(record => ({
        ...record,
        daily_activity: dailyActivity || null
      }));

      const { error } = await supabase
        .from('attendance')
        .insert(recordsWithActivity);

      if (error) throw error;

      await fetchAttendance();
      return { success: true };
    } catch (err: any) {
      throw err;
    }
  };

  const checkDuplicateAttendance = async (
    classId: string,
    subjectId: string,
    date: string
  ): Promise<boolean> => {
    try {
      const { data: existingRecords, error } = await supabase
        .from('attendance')
        .select('id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .eq('date', date)
        .limit(1);

      if (error) throw error;
      return (existingRecords && existingRecords.length > 0) || false;
    } catch (err: any) {
      console.error('Error checking duplicate attendance:', err);
      return false;
    }
  };

  const deleteBatchAttendance = async (attendanceIds: string[]) => {
    try {
      // Buscar dados antes de excluir para auditoria
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, class_id, subject_id, date, is_present')
        .in('id', attendanceIds);

      const { error } = await supabase
        .from('attendance')
        .delete()
        .in('id', attendanceIds);

      if (error) throw error;

      // Registrar auditoria para cada registro excluído
      const { data: { user } } = await supabase.auth.getUser();
      if (user && attendanceData) {
        const auditLogs = attendanceIds.map((id, index) => ({
          user_id: user.id,
          action: 'DELETE',
          table_name: 'attendance',
          record_id: id,
          accessed_fields: ['student_id', 'class_id', 'subject_id', 'date', 'is_present']
        }));
        await supabase.from('audit_logs').insert(auditLogs);
      }

      await fetchAttendance();
      toast({
        title: "Sucesso!",
        description: `${attendanceIds.length} registro(s) de frequência excluído(s).`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir registros."
      });
      throw err;
    }
  };

  const getGroupedAttendance = (): GroupedAttendance[] => {
    const grouped = data.reduce((acc, record) => {
      const key = `${record.date}-${record.subject_id}-${record.class_id}`;
      if (!acc[key]) {
        acc[key] = {
          date: record.date,
          subject_id: record.subject_id,
          subject_name: record.subject_name,
          class_id: record.class_id,
          class_name: record.class_name,
          daily_activity: record.daily_activity,
          total_students: 0,
          present_count: 0,
          absent_count: 0,
          records: []
        };
      }
      acc[key].total_students++;
      if (record.is_present) {
        acc[key].present_count++;
      } else {
        acc[key].absent_count++;
      }
      acc[key].records.push(record);
      return acc;
    }, {} as Record<string, GroupedAttendance>);

    // Ordenar registros dentro de cada grupo alfabeticamente por nome do aluno
    Object.values(grouped).forEach(group => {
      group.records.sort((a, b) => 
        (a.student_name || '').localeCompare(b.student_name || '', 'pt-BR')
      );
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const updateBatchAttendance = async (
    updates: Array<{ id: string; updates: Partial<Attendance> }>
  ) => {
    try {
      const promises = updates.map(({ id, updates: recordUpdates }) =>
        supabase
          .from('attendance')
          .update(recordUpdates)
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar ${errors.length} registro(s)`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const auditLogs = updates.map(({ id }) => ({
          user_id: user.id,
          action: 'BATCH_UPDATE',
          table_name: 'attendance',
          record_id: id,
          accessed_fields: ['is_present', 'justification']
        }));
        await supabase.from('audit_logs').insert(auditLogs);
      }

      await fetchAttendance();
      toast({
        title: "Sucesso!",
        description: `${updates.length} registro(s) atualizado(s).`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar registros."
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
    deleteAttendance,
    deleteBatchAttendance,
    createBatchAttendance,
    checkDuplicateAttendance,
    getGroupedAttendance,
    updateBatchAttendance
  };
};