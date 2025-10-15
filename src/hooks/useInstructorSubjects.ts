import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface InstructorSubject {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  student_count: number;
}

export function useInstructorSubjects() {
  const [subjects, setSubjects] = useState<InstructorSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    async function fetchInstructorSubjects() {
      // Aguardar role ser carregado
      if (roleLoading) {
        return;
      }

      // Verificar se é instrutor usando o role do useUserRole
      if (!user?.id || role !== 'instructor') {
        setSubjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Buscando disciplinas para instrutor:', user.id);

        const { data, error: rpcError } = await supabase
          .rpc('get_instructor_subjects', { instructor_id: user.id });

        if (rpcError) {
          console.error('❌ Erro RPC:', rpcError);
          throw rpcError;
        }

        console.log('✅ Disciplinas encontradas:', data?.length || 0);
        setSubjects(data || []);
      } catch (err) {
        console.error('❌ Erro ao buscar disciplinas do instrutor:', err);
        setError('Erro ao carregar disciplinas');
      } finally {
        setLoading(false);
      }
    }

    fetchInstructorSubjects();
  }, [user?.id, role, roleLoading]);

  // Implementar refetch funcional
  const refetch = async () => {
    if (!user?.id || role !== 'instructor') return;
    
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase
        .rpc('get_instructor_subjects', { instructor_id: user.id });

      if (rpcError) throw rpcError;
      setSubjects(data || []);
    } catch (err) {
      console.error('Erro ao recarregar disciplinas:', err);
    } finally {
      setLoading(false);
    }
  };

  return { subjects, loading: loading || roleLoading, error, refetch };
}
