import { useSupabaseAuth } from './useSupabaseAuth';

export const useAuth = () => {
  const { user, loading, login, register, logout, isAuthenticated, profile } = useSupabaseAuth();

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