import { useApiAuth } from './useApiAuth';

export const useAuth = () => {
  const { user, loading, login, register, signOut, isAuthenticated, profile } = useApiAuth();

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated,
    login,
    register,
  };
};