import { useSupabaseData } from './useSupabaseData';

export const useDeclarations = () => {
  return useSupabaseData('declarations');
};