import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from './use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useApiAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Decodificar JWT básico para pegar dados do usuário
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp > Date.now() / 1000) {
          setUser(payload.data);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      setUser(response.user);
      
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso."
      });
      
      return response.user;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao fazer login."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'student') => {
    try {
      setLoading(true);
      const response = await apiClient.register(name, email, password, role);
      setUser(response.user);
      
      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso."
      });
      
      return response.user;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar conta."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    toast({
      title: "Sucesso!",
      description: "Logout realizado com sucesso."
    });
  };

  return {
    user,
    profile: user, // Para compatibilidade com código existente
    loading,
    login,
    register,
    signOut: logout,
    isAuthenticated: !!user,
  };
};