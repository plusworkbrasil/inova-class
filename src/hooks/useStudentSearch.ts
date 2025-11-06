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
        console.log('🔍 [useStudentSearch] Buscando alunos com termo:', debouncedSearch);
        
        // Primeiro buscar os alunos
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('id, name, student_id, enrollment_number, class_id, status')
          .ilike('name', `%${debouncedSearch}%`)
          .or('class_id.not.is.null,student_id.not.is.null,enrollment_number.not.is.null')
          .order('name')
          .limit(10);

        if (studentsError) throw studentsError;

        console.log('✅ [useStudentSearch] Encontrados:', studentsData?.length, 'alunos');

        // Depois buscar os nomes das turmas
        const classIds = [...new Set(studentsData?.map(s => s.class_id).filter(Boolean))];
        let classesMap = new Map();

        if (classIds.length > 0) {
          console.log('📚 [useStudentSearch] Buscando', classIds.length, 'turmas');
          
          const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('id, name')
            .in('id', classIds);
          
          if (!classesError && classesData) {
            classesMap = new Map(classesData.map(c => [c.id, c.name]));
          }
        }

        // Formatar os dados
        const formatted = (studentsData || []).map((student: any) => ({
          id: student.id,
          name: student.name,
          student_id: student.student_id || '',
          enrollment_number: student.enrollment_number || '',
          class_id: student.class_id || '',
          status: student.status || 'active',
          class_name: student.class_id ? classesMap.get(student.class_id) : undefined
        }));

        console.log('📋 [useStudentSearch] Resultados formatados:', formatted.length);
        setStudents(formatted);
      } catch (err: any) {
        console.error('❌ [useStudentSearch] Erro ao buscar alunos:', err);
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
