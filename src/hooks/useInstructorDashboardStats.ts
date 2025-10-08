import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InstructorDashboardStats {
  myClasses: number;
  myStudents: number;
  pendingAttendance: number;
  gradesToLaunch: number;
}

export const useInstructorDashboardStats = () => {
  const [stats, setStats] = useState<InstructorDashboardStats>({
    myClasses: 0,
    myStudents: 0,
    pendingAttendance: 0,
    gradesToLaunch: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchInstructorStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get subjects where instructor teaches
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .or(`teacher_id.eq.${profile.id}${profile.instructor_subjects && profile.instructor_subjects.length > 0 ? `,name.in.(${profile.instructor_subjects.map(s => `"${s}"`).join(',')})` : ''}`);

      if (subjectsError) throw subjectsError;

      const subjectIds = subjects?.map(s => s.id) || [];
      const classIds = [...new Set(subjects?.map(s => s.class_id).filter(Boolean))];

      // Count unique classes
      const myClasses = classIds.length;

      // Count students in instructor's classes - join with user_roles
      const { data: studentProfiles, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);

      if (studentsError) throw studentsError;

      // Filter students by role using user_roles
      let studentsCount = 0;
      if (studentProfiles && studentProfiles.length > 0) {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .in('user_id', studentProfiles.map(p => p.id));
        studentsCount = count || 0;
      }

      // Calculate pending attendance (classes without attendance records in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('subject_id, date')
        .in('subject_id', subjectIds.length > 0 ? subjectIds : ['00000000-0000-0000-0000-000000000000'])
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

      if (attendanceError) throw attendanceError;

      // Calculate pending attendance based on working days without records
      const workingDays = 5; // Assuming 5 working days per week
      const attendanceRecords = recentAttendance?.length || 0;
      const expectedRecords = subjectIds.length * workingDays;
      const pendingAttendance = Math.max(0, expectedRecords - attendanceRecords);

      // Calculate grades to launch (estimate based on classes vs existing grades)
      const { count: gradesCount, error: gradesError } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .in('subject_id', subjectIds.length > 0 ? subjectIds : ['00000000-0000-0000-0000-000000000000']);

      if (gradesError) throw gradesError;

      // Estimate grades to launch (assume 2 grades per student per subject minimum)
      const expectedGrades = (studentsCount || 0) * subjectIds.length * 2;
      const gradesToLaunch = Math.max(0, expectedGrades - (gradesCount || 0));

      setStats({
        myClasses,
        myStudents: studentsCount || 0,
        pendingAttendance,
        gradesToLaunch
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching instructor stats:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar estatísticas do instrutor."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'instructor') {
      fetchInstructorStats();
    }
  }, [profile]);

  return {
    stats,
    loading,
    error,
    refetch: fetchInstructorStats
  };
};