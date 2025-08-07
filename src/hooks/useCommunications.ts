import { useSupabaseData } from './useSupabaseData';

export const useCommunications = () => {
  return useSupabaseData(
    'communications',
    `
      *,
      author:profiles!communications_author_id_fkey(name)
    `
  );
};