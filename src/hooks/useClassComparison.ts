import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassMetrics {
  id: string;
  name: string;
  totalStudents: number;
  attendanceRate: number;
  avgGrade: number | null;
  recentAbsences: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export const useClassComparison = () => {
  return useQuery({
    queryKey: ['class-comparison'],
    queryFn: async () => {
      // Fetch all classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

      if (classesError) throw classesError;
      if (!classes || classes.length === 0) return [];

      // Fetch metrics for each class
      const classMetrics = await Promise.all(
        classes.map(async (classItem) => {
          // Count students in this class
          const { count: studentCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)
            .eq('status', 'active');

          // Get student IDs for this class
          const { data: students } = await supabase
            .from('profiles')
            .select('id')
            .eq('class_id', classItem.id)
            .eq('status', 'active');

          const studentIds = students?.map(s => s.id) || [];

          if (studentIds.length === 0) {
            return {
              id: classItem.id,
              name: classItem.name,
              totalStudents: 0,
              attendanceRate: 0,
              avgGrade: null,
              recentAbsences: 0,
              status: 'critical' as const,
            };
          }

          // Calculate attendance rate (all time)
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('is_present')
            .in('student_id', studentIds);

          const totalAttendance = attendanceData?.length || 0;
          const presentCount = attendanceData?.filter(a => a.is_present).length || 0;
          const attendanceRate = totalAttendance > 0 
            ? Math.round((presentCount / totalAttendance) * 100 * 10) / 10
            : 0;

          // Calculate average grade
          const { data: gradesData } = await supabase
            .from('grades')
            .select('value, max_value')
            .in('student_id', studentIds);

          const normalizedGrades = gradesData?.map(g => (g.value / g.max_value) * 10) || [];
          const avgGrade = normalizedGrades.length > 0
            ? Math.round((normalizedGrades.reduce((a, b) => a + b, 0) / normalizedGrades.length) * 10) / 10
            : null;

          // Count recent absences (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { count: recentAbsencesCount } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .in('student_id', studentIds)
            .eq('is_present', false)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

          // Determine status
          let status: ClassMetrics['status'];
          if (attendanceRate >= 90) {
            status = 'excellent';
          } else if (attendanceRate >= 80) {
            status = 'good';
          } else if (attendanceRate >= 70) {
            status = 'warning';
          } else {
            status = 'critical';
          }

          return {
            id: classItem.id,
            name: classItem.name,
            totalStudents: studentCount || 0,
            attendanceRate,
            avgGrade,
            recentAbsences: recentAbsencesCount || 0,
            status,
          };
        })
      );

      return classMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
