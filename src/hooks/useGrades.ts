import { useSupabaseData } from './useSupabaseData';

export const useGrades = () => {
  return useSupabaseData(
    'grades',
    `
      *,
      student:profiles!grades_student_id_fkey(name, student_id),
      subject:subjects!grades_subject_id_fkey(name),
      teacher:profiles!grades_teacher_id_fkey(name)
    `
  );
};