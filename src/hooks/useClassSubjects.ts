import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectWithTeacher {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  class_id: string | null;
  teacher_id: string | null;
  start_date: string | null;
  end_date: string | null;
  workload: number | null;
  status: string;
  teacher_name?: string;
}

export function useClassSubjects(classId: string | null) {
  const [subjects, setSubjects] = useState<SubjectWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      if (!classId) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('subjects')
          .select(`
            *,
            teacher:profiles!subjects_teacher_id_fkey(name)
          `)
          .eq('class_id', classId)
          .order('start_date', { ascending: true, nullsFirst: false });

        if (fetchError) throw fetchError;

        const subjectsWithTeacher = (data || []).map(subject => ({
          ...subject,
          teacher_name: subject.teacher?.name || 'Não atribuído'
        }));

        setSubjects(subjectsWithTeacher);
      } catch (err: any) {
        console.error('Erro ao buscar disciplinas:', err);
        setError(err.message || 'Erro ao carregar disciplinas');
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, [classId]);

  return { subjects, loading, error };
}
