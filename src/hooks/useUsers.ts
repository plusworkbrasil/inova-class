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
  class_name?: string;
  instructor_subjects?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  const fetchUsers = async (
    page = 1, 
    searchTerm = '',
    roleFilter = '',
    statusFilter = ''
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      
      // OPÇÃO 4: Busca em batch (2 queries otimizadas)
      // 1. Buscar profiles com classes (sem user_roles para evitar erro de relação)
      let query = supabase
        .from('profiles')
        .select('*, classes!profiles_class_id_fkey(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      // Adicionar busca se houver termo
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Adicionar filtro de status se fornecido
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: profiles, error, count } = await query;

      if (error) throw error;

      // 2. Buscar roles para TODOS os usuários de uma vez (batch query)
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // 3. Combinar dados no frontend
      let processedUsers = (profiles || []).map((user: any) => {
        const userRole = roles?.find(r => r.user_id === user.id)?.role || 'student';
        const className = Array.isArray(user.classes) && user.classes.length > 0
          ? user.classes[0].name
          : null;
        
        return {
          ...user,
          role: userRole,
          class_name: className,
          classes: undefined
        };
      });

      // 4. Aplicar filtro de role após combinação
      if (roleFilter) {
        processedUsers = processedUsers.filter((user: any) => user.role === roleFilter);
      }

      setUsers(processedUsers as User[]);
      // Ajustar contagem se filtro de role foi aplicado
      const finalCount = roleFilter ? processedUsers.length : (count || 0);
      setTotalCount(finalCount);
      setTotalPages(Math.ceil(finalCount / pageSize));
      setCurrentPage(page);
      
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

  const nextPage = (searchTerm = '', roleFilter = '', statusFilter = '') => {
    if (currentPage < totalPages) {
      fetchUsers(currentPage + 1, searchTerm, roleFilter, statusFilter);
    }
  };

  const prevPage = (searchTerm = '', roleFilter = '', statusFilter = '') => {
    if (currentPage > 1) {
      fetchUsers(currentPage - 1, searchTerm, roleFilter, statusFilter);
    }
  };

  const goToPage = (page: number, searchTerm = '', roleFilter = '', statusFilter = '') => {
    if (page >= 1 && page <= totalPages) {
      fetchUsers(page, searchTerm, roleFilter, statusFilter);
    }
  };

  const createUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      // ALWAYS use edge function for user creation (unified flow)
      const { password, ...userDataWithoutPassword } = userData;
      
      const requestBody: any = { 
        userData: userDataWithoutPassword
      };
      
      // Include password if provided
      if (password) {
        requestBody.password = password;
      }
      
      const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
        body: requestBody
      });

      if (authError) throw authError;

      // Refresh the users list
      await fetchUsers();
      
      const successMessage = authData.temporaryPassword 
        ? `O usuário ${userData.name} foi criado. Senha temporária: ${authData.temporaryPassword}`
        : `O usuário ${userData.name} foi criado com sucesso!`;
      
      toast({
        title: "Usuário criado com sucesso!",
        description: successMessage,
      });

      return authData;
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
      // Separar role e email dos demais campos
      const { role: incomingRole, email: newEmail, ...profileUpdates } = updates;
      
      // Normalizar "teacher" para "instructor" (compatibilidade)
      const normalizedRole = incomingRole === 'teacher' ? 'instructor' : incomingRole;
      
      // FASE 2: Se o email foi alterado, sincronizar com auth.users ANTES de atualizar profiles
      if (newEmail) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', id)
          .single();
        
        // Só sincronizar se o email realmente mudou
        if (currentProfile?.email !== newEmail) {
          console.log(`Email change detected: ${currentProfile?.email} → ${newEmail}`);
          
          try {
            // Usar admin API via Edge Function para atualizar auth.users
            const { data: authUpdateData, error: authUpdateError } = await supabase.functions.invoke(
              'update-user-email', 
              {
                body: { 
                  userId: id, 
                  newEmail: newEmail 
                }
              }
            );
            
            if (authUpdateError) {
              console.error('Auth email sync error:', authUpdateError);
              toast({
                title: "Aviso",
                description: "Email atualizado no perfil, mas houve erro ao sincronizar com autenticação. Execute a sincronização manual em Configurações.",
                variant: "destructive",
              });
              // Não bloquear a atualização do perfil
            } else {
              console.log('Auth email synced successfully:', authUpdateData);
              toast({
                title: "Email sincronizado",
                description: "O email foi atualizado tanto no perfil quanto na autenticação.",
              });
            }
          } catch (syncError) {
            console.error('Exception during email sync:', syncError);
            // Continuar mesmo se a sincronização falhar
          }
        }
      }
      
      // Remove campos undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([_, value]) => value !== undefined)
      );
      
      // Adicionar email de volta se foi fornecido
      if (newEmail) {
        (cleanUpdates as any).email = newEmail;
      }

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

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await updateUser(userId, { status: newStatus });
      
      toast({
        title: "Status atualizado",
        description: `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`,
      });
      
      await fetchUsers(currentPage, '', '', '');
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      toast({
        title: "Erro ao atualizar status",
        description: err.message || "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const inviteStudent = async (email: string, name: string, classId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-student', {
        body: { email, name, class_id: classId }
      });

      if (error) throw error;

      await fetchUsers();
      return data;
    } catch (err: any) {
      toast({
        variant: "destructive", 
        title: "Erro",
        description: err.message || "Erro ao criar aluno."
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
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    inviteStudent,
    nextPage,
    prevPage,
    goToPage
  };
};