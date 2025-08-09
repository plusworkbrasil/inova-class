import { useApiData } from './useApiData';

export const useSubjects = () => {
  return useApiData('subjects');
};