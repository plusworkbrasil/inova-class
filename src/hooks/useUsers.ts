import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'secretary' | 'instructor' | 'student' | 'teacher' | 'coordinator' | 'tutor';
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cpf?: string;
  full_name?: string;
  avatar?: string;
  parent_name?: string;
  escolaridade?: string;
  guardian_name?: string;
  guardian_phone?: string;
  student_id?: string;
  class_id?: string;
  instructor_subjects?: string[];
  created_at?: string;
  updated_at?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
      toast({
        title: "Erro ao carregar usuários",
        description: err.message || "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      // Para criar um usuário com senha, usar diretamente o supabase.auth.signUp
      if (userData.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email!,
          password: userData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: userData.name,
              role: userData.role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Atualizar o perfil com dados adicionais
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: userData.name,
              role: userData.role,
              phone: userData.phone,
              cep: userData.cep,
              street: userData.street,
              number: userData.number,
              complement: userData.complement,
              neighborhood: userData.neighborhood,
              city: userData.city,
              state: userData.state,
              class_id: userData.class_id,
              cpf: userData.cpf,
              full_name: userData.full_name,
              avatar: userData.avatar,
              parent_name: userData.parent_name,
              escolaridade: userData.escolaridade,
              guardian_name: userData.guardian_name,
              guardian_phone: userData.guardian_phone,
              student_id: userData.student_id,
              instructor_subjects: userData.instructor_subjects
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }

        // Refresh the users list
        await fetchUsers();
        
        toast({
          title: "Usuário criado com sucesso!",
          description: `O usuário ${userData.name} foi criado com senha.`,
        });

        return authData;
      } else {
        // Usar a edge function para criação sem senha (convite)
        const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
          body: { userData }
        });

        if (authError) throw authError;

        // Refresh the users list
        await fetchUsers();
        
        toast({
          title: "Usuário criado com sucesso!",
          description: `O usuário ${userData.name} foi criado.`,
        });

        return authData;
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast({
        title: "Erro ao criar usuário",
        description: err.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      // Remove campos undefined/null para evitar problemas
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
      );

      console.log('Updating user with data:', cleanUpdates);

      const { data, error } = await supabase
        .from('profiles')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Atualizar o estado local
      setUsers(users.map(u => u.id === id ? { ...u, ...data } : u));
      
      toast({
        title: "Usuário atualizado com sucesso!",
        description: `O usuário foi atualizado.`,
      });

      return data;
    } catch (err: any) {
      console.error('Error updating user:', err);
      
      // Mensagens de erro mais específicas
      let errorMessage = "Não foi possível atualizar o usuário.";
      if (err.message.includes('role')) {
        errorMessage = "Erro: Você não tem permissão para alterar funções de usuário.";
      } else if (err.message.includes('RLS')) {
        errorMessage = "Erro: Acesso negado. Verifique suas permissões.";
      } else if (err.message.includes('Access denied')) {
        errorMessage = "Erro: Acesso negado. Verifique suas permissões.";
      }
      
      toast({
        title: "Erro ao atualizar usuário",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Call edge function with admin privileges validation
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      });

      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido do sistema.',
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Erro ao excluir usuário',
        description: err.message || 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const inviteStudent = async (email: string, name: string, classId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-student', {
        body: { email, name, class_id: classId }
      });

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Sucesso!",
        description: "Convite enviado com sucesso."
      });
    } catch (err: any) {
      toast({
        variant: "destructive", 
        title: "Erro",
        description: err.message || "Erro ao enviar convite."
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    inviteStudent
  };
};