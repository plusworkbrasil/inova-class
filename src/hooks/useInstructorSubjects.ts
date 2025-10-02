import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  const { user, profile } = useAuth();

  useEffect(() => {
    async function fetchInstructorSubjects() {
      if (!user?.id || profile?.role !== 'instructor') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase
          .rpc('get_instructor_subjects', { instructor_id: user.id });

        if (rpcError) {
          throw rpcError;
        }

        setSubjects(data || []);
      } catch (err) {
        console.error('Erro ao buscar disciplinas do instrutor:', err);
        setError('Erro ao carregar disciplinas');
      } finally {
        setLoading(false);
      }
    }

    fetchInstructorSubjects();
  }, [user?.id, profile?.role]);

  return { subjects, loading, error, refetch: () => {} };
}
