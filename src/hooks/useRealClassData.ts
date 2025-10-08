import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClassStats {
  totalStudents: number;
  averagePerClass: number;
  totalInstructors: number;
}

export const useRealClassData = () => {
  const [stats, setStats] = useState<ClassStats>({
    totalStudents: 0,
    averagePerClass: 0,
    totalInstructors: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get total students (profiles with class_id)
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .not('class_id', 'is', null);

      if (studentsError) throw studentsError;

      // Get total classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id');

      if (classesError) throw classesError;

      // Get total instructors (distinct teacher_id from subjects)
      const { data: subjects, error: instructorsError } = await supabase
        .from('subjects')
        .select('teacher_id')
        .not('teacher_id', 'is', null);

      if (instructorsError) throw instructorsError;

      const totalStudents = students?.length || 0;
      const totalClasses = classes?.length || 0;
      const uniqueInstructors = new Set(subjects?.map(s => s.teacher_id) || []);
      const totalInstructors = uniqueInstructors.size;
      const averagePerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

      setStats({
        totalStudents,
        averagePerClass,
        totalInstructors
      });
    } catch (error) {
      console.error('Error fetching class stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};