import { useApiData } from './useApiData';

export const useGrades = () => {
  return useApiData('grades');
};