import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineSubject {
  id: string;
  name: string;
  class_name: string;
  class_id: string;
  start_date: string;
  end_date: string;
  teacher_name: string | null;
  teacher_id: string | null;
}

export function useAllSubjectsTimeline() {
  const [subjects, setSubjects] = useState<TimelineSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('subjects')
          .select(`
            id,
            name,
            start_date,
            end_date,
            class_id,
            classes!subjects_class_id_fkey (
              name
            ),
            profiles!subjects_teacher_id_fkey (
              name
            )
          `)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)
          .order('start_date', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        const formattedData: TimelineSubject[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          class_name: item.classes?.name || 'Sem turma',
          class_id: item.class_id || '',
          start_date: item.start_date,
          end_date: item.end_date,
          teacher_name: item.profiles?.name || null,
        }));

        // Sort by class name, then by start date
        formattedData.sort((a, b) => {
          const classCompare = a.class_name.localeCompare(b.class_name);
          if (classCompare !== 0) return classCompare;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });

        setSubjects(formattedData);
      } catch (err: any) {
        console.error('Error fetching timeline subjects:', err);
        setError(err.message || 'Erro ao carregar disciplinas');
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  return { subjects, loading, error };
}
