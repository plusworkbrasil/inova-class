import { useApiData } from './useApiData';

export const useCommunications = () => {
  return useApiData('communications');
};