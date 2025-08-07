import { useSupabaseData } from './useSupabaseData';

export const useEvasions = () => {
  return useSupabaseData(
    'evasions',
    `
      *,
      student:profiles!evasions_student_id_fkey(name, student_id),
      reported_by_profile:profiles!evasions_reported_by_fkey(name)
    `
  );
};