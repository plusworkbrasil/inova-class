import { useSupabaseAuth } from './useSupabaseAuth';

export const useAuth = () => {
  const { user, loading, login, register, signOut, isAuthenticated, profile } = useSupabaseAuth();

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