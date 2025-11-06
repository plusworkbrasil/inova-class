import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

export interface StudentSearchResult {
  id: string;
  name: string;
  student_id: string;
  enrollment_number: string;
  class_id: string;
  class_name?: string;
  status: string;
}

export const useStudentSearch = (searchTerm: string) => {
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setStudents([]);
      return;
    }

    const searchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            student_id,
            enrollment_number,
            class_id,
            status,
            classes:class_id(name)
          `)
          .ilike('name', `%${debouncedSearch}%`)
          .or('class_id.not.is.null,student_id.not.is.null,enrollment_number.not.is.null')
          .order('name')
          .limit(10);

        if (error) throw error;

        const formatted = (data || []).map((student: any) => ({
          id: student.id,
          name: student.name,
          student_id: student.student_id || '',
          enrollment_number: student.enrollment_number || '',
          class_id: student.class_id || '',
          status: student.status || 'active',
          class_name: student.classes?.name
        }));

        setStudents(formatted);
      } catch (err: any) {
        console.error('Erro ao buscar alunos:', err);
        console.error('Detalhes:', err?.message, err?.details);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    searchStudents();
  }, [debouncedSearch]);

  return { students, loading };
};
