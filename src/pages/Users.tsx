import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye, UserPlus } from 'lucide-react';
import { UserRole } from '@/types/user';
import { StudentForm } from '@/components/forms/StudentForm';
import { UserForm } from '@/components/forms/UserForm';
import { InviteStudentForm } from '@/components/forms/InviteStudentForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { apiClient } from '@/lib/api';
import { roleTranslations } from '@/lib/roleTranslations';
import { useAuth } from '@/hooks/useAuth';

const Users = () => {
  const { user } = useAuth();
  const userRole = (user?.role || 'admin') as UserRole;
  const userName = user?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('profiles');
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: any) => {
    try {
      const newUser = await apiClient.create('profiles', {
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      });

      setUsers([newUser, ...users]);
      toast({
        title: "Usuário criado com sucesso!",
        description: `O usuário ${data.name} foi criado.`,
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStudent = async (studentData: any) => {
    try {
      // Transformar dados do estudante para o formato esperado
      const userData = {
        name: studentData.fullName,
        email: studentData.email,
        role: 'student',
        phone: studentData.phone,
        cep: studentData.cep,
        street: studentData.street,
        number: studentData.number,
        complement: studentData.complement,
        neighborhood: studentData.neighborhood,
        city: studentData.city,
        state: studentData.state,
        cpf: studentData.cpf,
        full_name: studentData.fullName,
        photo: studentData.photo,
        parent_name: studentData.parentName,
        escolaridade: studentData.escolaridade,
      };

      await handleCreateUser(userData);
    } catch (error) {
      console.error('Erro ao criar aluno:', error);
      toast({
        title: "Erro ao criar aluno",
        description: "Não foi possível criar o aluno.",
        variant: "destructive",
      });
    }
  };

  const handleInviteStudent = async (email: string, name: string) => {
    try {
      // Por enquanto, simula o convite criando o usuário diretamente
      const userData = {
        name: name,
        email: email,
        role: 'student',
      };

      await handleCreateUser(userData);
      
      toast({
        title: "Convite enviado!",
        description: `Usuário ${name} foi criado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao convidar estudante:', error);
      toast({
        title: "Erro ao convidar estudante",
        description: error.message || "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (userData: any) => {
    try {
      const updatedUser = await apiClient.update('profiles', editingUser.id, {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        cep: userData.cep,
        street: userData.street,
        number: userData.number,
        complement: userData.complement,
        neighborhood: userData.neighborhood,
        city: userData.city,
        state: userData.state,
      });

      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      setEditingUser(null);
      
      toast({
        title: "Usuário atualizado com sucesso!",
        description: `O usuário ${userData.name} foi atualizado.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.delete('profiles', userId);
      setUsers(users.filter(u => u.id !== userId));
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido do sistema.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (user: any) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'coordinator': return 'default';
      case 'teacher': return 'secondary';
      case 'secretary': return 'outline';
      case 'tutor': return 'secondary';
      case 'student': return 'outline';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <div className="flex gap-2">
            <InviteStudentForm onSubmit={handleInviteStudent} />
            <StudentForm onSubmit={handleCreateStudent} />
            <UserForm onSubmit={handleCreateUser} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filtrar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {roleTranslations[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <UserForm 
                          onSubmit={handleEditUser}
                          initialData={user}
                          mode="edit"
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit size={14} />
                            </Button>
                          }
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <DeleteConfirmation
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => handleDeleteUser(deletingUser?.id)}
          title="Excluir Usuário"
          description="Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema."
          itemName={deletingUser?.name}
        />
      </div>
    </Layout>
  );
};

export default Users;