import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'secretary' | 'instructor' | 'student' | 'teacher' | 'coordinator' | 'tutor';
  phone?: string;
  birth_date?: string;
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
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Fetch roles for all users
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roleData } = await supabase
            .rpc('get_user_role', { user_id: user.id });
          return { ...user, role: roleData || 'student' };
        })
      );
      
      setUsers(usersWithRoles as User[]);
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
          // Atualizar o perfil com dados adicionais (SEM role)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: userData.name,
              phone: userData.phone,
              birth_date: userData.birth_date || null,
              cep: userData.cep,
              street: userData.street,
              number: userData.number,
              complement: userData.complement,
              neighborhood: userData.neighborhood,
              city: userData.city,
              state: userData.state,
              class_id: userData.class_id && userData.class_id !== "" ? userData.class_id : null,
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
            throw profileError;
          }

          // Inserir role na tabela user_roles
          if (userData.role) {
            const normalizedRole = userData.role === 'teacher' ? 'instructor' : userData.role;
            const { data: currentUser } = await supabase.auth.getUser();
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authData.user.id,
                role: normalizedRole,
                granted_by: currentUser?.user?.id
              });

            if (roleError) {
              console.error('Error inserting role:', roleError);
              throw roleError;
            }
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
      // Separar role dos demais campos
      const { role: incomingRole, ...profileUpdates } = updates;
      
      // Normalizar "teacher" para "instructor" (compatibilidade)
      const normalizedRole = incomingRole === 'teacher' ? 'instructor' : incomingRole;
      
      // Remove campos undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([_, value]) => value !== undefined)
      );

      // Compatibilidade: manter 'photo' sincronizado com 'avatar'
      if (Object.prototype.hasOwnProperty.call(cleanUpdates, 'avatar') && !Object.prototype.hasOwnProperty.call(cleanUpdates, 'photo')) {
        (cleanUpdates as any).photo = (cleanUpdates as any).avatar ?? null;
      }

      // Normalizar strings vazias para null em campos específicos (ex.: UUID)
      if (Object.prototype.hasOwnProperty.call(cleanUpdates, 'class_id') && (cleanUpdates as any).class_id === '') {
        (cleanUpdates as any).class_id = null;
      }

      // Atualizar role se fornecido e diferente do atual
      if (normalizedRole) {
        const { data: currentRole } = await supabase.rpc('get_user_role', { user_id: id });
        
        if (currentRole !== normalizedRole) {
          // Deletar role antiga
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', id);
          
          // Inserir novo role
          const { data: currentUser } = await supabase.auth.getUser();
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: id,
              role: normalizedRole,
              granted_by: currentUser?.user?.id
            });

          if (roleError) {
            console.error('Error updating role:', roleError);
            throw roleError;
          }
        }
      }

      // Atualizar perfil na tabela profiles (sem role)
      console.log('Updating profile with data:', cleanUpdates);

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

      // Recarregar lista de usuários para refletir mudanças
      await fetchUsers();
      
      toast({
        title: "Usuário atualizado com sucesso!",
        description: `O usuário foi atualizado.`,
      });

      return data;
    } catch (err: any) {
      console.error('Error updating user:', err);
      
      let errorMessage = "Não foi possível atualizar o usuário.";
      if (err.message.includes('invalid input value for enum app_role')) {
        errorMessage = "Erro: Função inválida. Use 'instructor' ao invés de 'teacher'.";
      } else if (err.message.includes('role') || err.message.includes('RLS')) {
        errorMessage = "Erro: Você não tem permissão para alterar funções de usuário.";
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
      const { data, error } = await supabase.functions.invoke('delete-user-cascade', {
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