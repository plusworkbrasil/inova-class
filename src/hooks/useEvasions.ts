import { useSupabaseData } from './useSupabaseData';

export const useEvasions = () => {
  return useSupabaseData('evasions');
};