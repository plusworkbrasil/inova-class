import { useSupabaseData } from './useSupabaseData';

export const useGrades = () => {
  return useSupabaseData('grades');
};