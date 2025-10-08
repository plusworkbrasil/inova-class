import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  name: string;
  class: string;
  class_id: string;
  email: string;
}

export interface Class {
  id: string;
  name: string;
  students: number;
}

export const useRealRecipients = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      
      // Fetch students with their class information
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          class_id,
          classes(name)
        `)
        .not('class_id', 'is', null);

      if (studentsError) throw studentsError;

      // Fetch classes with student count
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*');

      if (classesError) throw classesError;

      // Count students per class
      const classStudentCounts = studentsData?.reduce((acc, student) => {
        const className = (student.classes as any)?.name || 'Sem Turma';
        acc[className] = (acc[className] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const processedStudents: Student[] = studentsData?.map(student => ({
        id: student.id,
        name: student.name || 'Nome não informado',
        class: (student.classes as any)?.name || 'Sem Turma',
        class_id: student.class_id || '',
        email: student.email || ''
      })) || [];

      const processedClasses: Class[] = classesData?.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        students: classStudentCounts[classItem.name] || 0
      })) || [];

      setStudents(processedStudents);
      setClasses(processedClasses);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  return {
    students,
    classes,
    loading,
    refetch: fetchRecipients
  };
};