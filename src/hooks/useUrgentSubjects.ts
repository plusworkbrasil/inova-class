import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { parseYMDToLocalDate } from '@/lib/utils';

export interface UrgentSubject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  class_id: string | null;
  class_name: string | null;
  class_year: number | null;
  teacher_id: string | null;
  teacher_name: string | null;
  start_date: string | null;
  end_date: string | null;
  workload: number | null;
  status: string;
  days_remaining: number;
}

export function useUrgentSubjects() {
  const [subjects, setSubjects] = useState<UrgentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUrgentSubjects() {
      try {
        setLoading(true);
        setError(null);

        // Buscar todas as disciplinas com end_date
        const { data, error: fetchError } = await supabase
          .from('subjects')
          .select(`
            *,
            teacher:profiles!subjects_teacher_id_fkey(name),
            class:classes!subjects_class_id_fkey(name, year)
          `)
          .not('end_date', 'is', null)
          .order('end_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Filtrar apenas disciplinas urgentes (≤ 4 dias e não finalizadas)
        const now = new Date();
        const urgentSubjects = (data || [])
          .map((subject: any) => {
            const endDate = parseYMDToLocalDate(subject.end_date!);
            const daysRemaining = differenceInDays(endDate, now);
            
            return {
              ...subject,
              class_name: subject.class?.name || 'Turma não definida',
              class_year: subject.class?.year || null,
              teacher_name: subject.teacher?.name || 'Não atribuído',
              days_remaining: daysRemaining
            };
          })
          .filter((subject: UrgentSubject) => {
            // Incluir apenas se: 0 <= dias restantes <= 4
            return subject.days_remaining >= 0 && subject.days_remaining <= 4;
          });

        setSubjects(urgentSubjects);
      } catch (err: any) {
        console.error('Erro ao buscar disciplinas urgentes:', err);
        setError(err.message || 'Erro ao carregar disciplinas urgentes');
      } finally {
        setLoading(false);
      }
    }

    fetchUrgentSubjects();
  }, []);

  return { subjects, loading, error };
}
