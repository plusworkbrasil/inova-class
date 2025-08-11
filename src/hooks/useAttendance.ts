import { useSupabaseData } from './useSupabaseData';

export const useAttendance = () => {
  return useSupabaseData('attendance');
};