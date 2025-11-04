import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Evasion {
  id: string;
  student_id: string;
  date: string;
  reported_by: string;
  reason: string;
  status: string;
  observations?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    class_id: string;
  };
  reporter_profile?: {
    name: string;
  };
}

export const useSupabaseEvasions = () => {
  const [data, setData] = useState<Evasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvasions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: evasions, error } = await supabase
        .from('evasions')
        .select(`
          *,
          profiles!evasions_student_id_fkey(name, class_id),
          reporter_profile:profiles!evasions_reported_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(evasions || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching evasions:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar evasões."
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvasion = async (evasionData: Omit<Evasion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // 1. Verificar se já existe evasão ativa para este aluno
      const { data: existingEvasion } = await supabase
        .from('evasions')
        .select('id')
        .eq('student_id', evasionData.student_id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingEvasion) {
        toast({
          variant: "destructive",
          title: "Evasão já registrada",
          description: "Este aluno já possui uma evasão ativa registrada."
        });
        throw new Error('Evasão já existe');
      }

      // 2. Buscar nome do aluno para auditoria
      const { data: student } = await supabase
        .from('profiles')
        .select('name, status')
        .eq('id', evasionData.student_id)
        .single();

      // 3. Inserir registro de evasão
      const { error: evasionError } = await supabase
        .from('evasions')
        .insert([evasionData]);

      if (evasionError) throw evasionError;

      // 4. Atualizar status do aluno para "inactive"
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', evasionData.student_id);

      if (updateError) throw updateError;

      // 5. Registrar auditoria da mudança de status
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: authData.user.id,
            action: 'STUDENT_STATUS_CHANGE_TO_INACTIVE',
            table_name: 'profiles',
            record_id: evasionData.student_id,
            accessed_fields: ['status']
          });
      }

      await fetchEvasions();
      toast({
        title: "Evasão registrada com sucesso!",
        description: `${student?.name || 'Aluno'} foi marcado como inativo.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao registrar evasão."
      });
      throw err;
    }
  };

  const updateEvasion = async (id: string, updates: Partial<Evasion>) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchEvasions();
      toast({
        title: "Sucesso!",
        description: "Evasão atualizada com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao atualizar evasão."
      });
      throw err;
    }
  };

  const deleteEvasion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEvasions();
      toast({
        title: "Sucesso!",
        description: "Evasão excluída com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir evasão."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEvasions();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchEvasions,
    createEvasion,
    updateEvasion,
    deleteEvasion
  };
};