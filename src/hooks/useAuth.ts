import { useApiAuth } from './useApiAuth';

export const useAuth = () => {
  const { user, loading, login, register, logout, isAuthenticated, profile } = useApiAuth();

  return {
    user,
    profile,
    loading,
    signOut: logout,
    isAuthenticated,
    login,
    register,
  };
};