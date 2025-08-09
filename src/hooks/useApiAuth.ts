import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  student_id?: string;
  class_id?: string;
  instructor_subjects?: string[];
}

export const useApiAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário armazenado
    const storedUser = apiClient.getStoredUser();
    const token = localStorage.getItem('auth_token');

    if (storedUser && token) {
      setUser(storedUser);
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'student') => {
    try {
      const response = await apiClient.register(email, password, name, role);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    profile: user, // Para compatibilidade com código existente
  };
};