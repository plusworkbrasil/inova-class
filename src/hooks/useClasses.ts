import { useSupabaseData } from './useSupabaseData';

export const useClasses = () => {
  return useSupabaseData(
    'classes',
    `
      *,
      teacher:profiles!classes_teacher_id_fkey(name)
    `
  );
};