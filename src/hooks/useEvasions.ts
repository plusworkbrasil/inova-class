import { useApiData } from './useApiData';

export const useEvasions = () => {
  return useApiData('evasions');
};