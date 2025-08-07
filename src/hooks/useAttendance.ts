import { useSupabaseData } from './useSupabaseData';

export const useAttendance = () => {
  return useSupabaseData(
    'attendance',
    `
      *,
      student:profiles!attendance_student_id_fkey(name, student_id),
      subject:subjects!attendance_subject_id_fkey(name),
      class:classes!attendance_class_id_fkey(name)
    `
  );
};