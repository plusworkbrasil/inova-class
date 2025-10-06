import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface InstructorClass {
  id: string;
  name: string;
  year: number;
}

export function useInstructorClasses() {
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    async function fetchInstructorClasses() {
      if (!user?.id || profile?.role !== 'instructor') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar as disciplinas do instrutor para pegar os class_id únicos
        const { data: subjects, error: subjectsError } = await supabase
          .rpc('get_instructor_subjects', { instructor_id: user.id });

        if (subjectsError) {
          throw subjectsError;
        }

        // Extrair class_ids únicos
        const classIds = [...new Set(subjects?.map((s: any) => s.class_id).filter(Boolean))];

        if (classIds.length === 0) {
          setClasses([]);
          return;
        }

        // Buscar dados completos das turmas
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, name, year')
          .in('id', classIds)
          .order('name');

        if (classesError) {
          throw classesError;
        }

        setClasses(classesData || []);
      } catch (err) {
        console.error('Erro ao buscar turmas do instrutor:', err);
        setError('Erro ao carregar turmas');
      } finally {
        setLoading(false);
      }
    }

    fetchInstructorClasses();
  }, [user?.id, profile?.role]);

  return { classes, loading, error };
}
