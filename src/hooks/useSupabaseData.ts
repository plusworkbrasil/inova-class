import { useApiData } from './useApiData';

export const useSupabaseData = (table: string, query?: string, dependencies: any[] = []) => {
  // Redirecionando para a nova implementação com API
  return useApiData(table, dependencies);

};