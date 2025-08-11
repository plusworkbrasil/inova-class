import { useSupabaseData } from './useSupabaseData';

export const useSubjects = () => {
  return useSupabaseData('subjects');
};