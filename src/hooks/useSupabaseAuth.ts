import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'secretary' | 'instructor' | 'student' | 'teacher';
  student_id?: string;
  class_id?: string;
  instructor_subjects?: string[];
  enrollment_number?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    setLoading(true);

    // Listen for auth changes FIRST (sync-only updates here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        // Defer any Supabase calls to avoid deadlocks
        setTimeout(() => {
          fetchProfile(nextUser.id).then((p) => setProfile(p));
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Then, get the current session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(() => {
            fetchProfile(currentUser.id).then((p) => setProfile(p));
          }, 0);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema."
      });

      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Credenciais inválidas."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'student') => {
    try {
      setLoading(true);
      
      // First create the user
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            role: role,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Registro realizado com sucesso!",
        description: "Bem-vindo ao sistema! Você já pode fazer login."
      });

      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: error.message || "Erro ao criar conta."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);

      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado do sistema."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message || "Erro ao fazer logout."
      });
    }
  };

  return {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};