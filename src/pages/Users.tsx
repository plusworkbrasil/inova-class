import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, Eye, Key } from 'lucide-react';
import { UserRole } from '@/types/user';
import { StudentForm } from '@/components/forms/StudentForm';
import { UserForm } from '@/components/forms/UserForm';
import { InviteStudentForm } from '@/components/forms/InviteStudentForm';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserDetailsDialog } from '@/components/ui/user-details-dialog';
import { PasswordUpdateDialog } from '@/components/ui/password-update-dialog';
import { BulkUserDelete } from '@/components/ui/bulk-user-delete';
import { roleTranslations } from '@/lib/roleTranslations';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';

const Users = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const { 
    users, 
    loading, 
    createUser, 
    updateUser, 
    deleteUser, 
    inviteStudent 
  } = useUsers();

  const handleCreateUser = async (data: any) => {
    await createUser({
      name: data.name,
      email: data.email,
      password: data.password, // Incluir senha
      role: data.role as 'admin' | 'secretary' | 'instructor' | 'student',
      class_id: data.class_id,
      phone: data.phone,
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      avatar: data.avatar,
    });
  };

  const handleCreateStudent = async (studentData: any) => {
    // Transformar dados do estudante para o formato esperado
    const userData = {
      name: studentData.fullName,
      email: studentData.email,
      password: studentData.password, // Incluir senha
      role: 'student' as const,
      class_id: studentData.class_id,
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
      avatar: studentData.avatar,
      parent_name: studentData.parentName,
      escolaridade: studentData.escolaridade,
      guardian_name: studentData.guardianName,
      guardian_phone: studentData.guardianPhone,
    };

    await createUser(userData);
  };

  const handleInviteStudent = async (email: string, name: string, classId?: string) => {
    await inviteStudent(email, name, classId);
  };

  const handleEditUser = async (userData: any, userId: string) => {
    await updateUser(userId, {
      name: userData.name,
      email: userData.email,
      role: userData.role as 'admin' | 'secretary' | 'instructor' | 'student',
      class_id: userData.class_id,
      phone: userData.phone,
      cep: userData.cep,
      street: userData.street,
      number: userData.number,
      complement: userData.complement,
      neighborhood: userData.neighborhood,
      city: userData.city,
      state: userData.state,
      avatar: userData.avatar,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setDeletingUser(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // O erro já foi tratado no hook useUsers
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const openDeleteDialog = (user: any) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (user: any) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const openPasswordDialog = (user: any) => {
    setPasswordUser(user);
    setIsPasswordDialogOpen(true);
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
            <BulkUserDelete />
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
                       <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                         {roleTranslations[user.role as UserRole] || user.role}
                       </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openViewDialog(user)}
                        >
                          <Eye size={14} />
                        </Button>
                        <UserForm 
                          onSubmit={(userData) => handleEditUser(userData, user.id)}
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
                          onClick={() => openPasswordDialog(user)}
                          title="Atualizar senha"
                        >
                          <Key size={14} />
                        </Button>
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
        
        <UserDetailsDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          user={viewingUser}
        />
        
        <PasswordUpdateDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          userId={passwordUser?.id || ''}
          userName={passwordUser?.name || ''}
        />
        
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