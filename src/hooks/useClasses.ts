import { useSupabaseData } from './useSupabaseData';

export const useClasses = () => {
  return useSupabaseData('classes');
};