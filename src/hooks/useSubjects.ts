import { useSupabaseData } from './useSupabaseData';

export const useSubjects = () => {
  return useSupabaseData(
    'subjects',
    `
      *,
      teacher:profiles!subjects_teacher_id_fkey(name),
      class:classes!subjects_class_id_fkey(name, grade)
    `
  );
};