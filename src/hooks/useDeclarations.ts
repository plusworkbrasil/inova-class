import { useSupabaseData } from './useSupabaseData';

export const useDeclarations = () => {
  return useSupabaseData(
    'declarations',
    `
      *,
      student:profiles!declarations_student_id_fkey(name, student_id),
      processed_by_profile:profiles!declarations_processed_by_fkey(name)
    `
  );
};