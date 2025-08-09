import { useApiData } from './useApiData';

export const useAttendance = () => {
  return useApiData('attendance');
};