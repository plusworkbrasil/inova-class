import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveClass {
  id: string;
  name: string;
  total_active_subjects: number;
}

export const useActiveClasses = () => {
  const [classes, setClasses] = useState<ActiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveClasses = async () => {
    try {
      setLoading(true);
      console.log('🔍 [useActiveClasses] Buscando turmas com disciplinas ativas');

      // Buscar subjects ativos e seus class_ids
      const { data: activeSubjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('class_id')
        .eq('status', 'ativo');

      if (subjectsError) throw subjectsError;

      // Extrair class_ids únicos
      const classIds = [...new Set(activeSubjects?.map(s => s.class_id).filter(Boolean))];

      if (classIds.length === 0) {
        setClasses([]);
        return;
      }

      // Buscar classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)
        .order('name');

      if (classesError) throw classesError;

      // Contar subjects ativos por turma
      const classesWithCount = (classesData || []).map(cls => {
        const count = activeSubjects?.filter(s => s.class_id === cls.id).length || 0;
        return {
          id: cls.id,
          name: cls.name,
          total_active_subjects: count
        };
      });

      console.log('✅ [useActiveClasses] Encontradas:', classesWithCount.length, 'turmas');
      setClasses(classesWithCount);
      setError(null);
    } catch (err: any) {
      console.error('❌ [useActiveClasses] Erro:', err);
      setError(err.message);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveClasses();
  }, []);

  return {
    classes,
    loading,
    error,
    refetch: fetchActiveClasses
  };
};
