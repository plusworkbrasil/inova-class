import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { UserRole } from '@/types/user';
import { StudentForm } from '@/components/forms/StudentForm';
import { UserForm } from '@/components/forms/UserForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';

const mockUsersData = [
  { id: 1, name: 'João Silva', email: 'joao@email.com', role: 'teacher' as UserRole, status: 'ativo' },
  { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'coordinator' as UserRole, status: 'ativo' },
  { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', role: 'secretary' as UserRole, status: 'inativo' },
  { id: 4, name: 'Ana Costa', email: 'ana@email.com', role: 'tutor' as UserRole, status: 'ativo' },
];

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(mockUsersData);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = (data: any) => {
    const newUser = {
      id: users.length + 1,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      phone: data.phone,
      status: data.status,
    };
    setUsers([...users, newUser]);
    toast({
      title: "Usuário criado com sucesso!",
      description: `O usuário ${data.name} foi criado.`,
    });
  };

  const handleEditUser = (userData: any) => {
    const updatedUsers = users.map(u => 
      u.id === editingUser.id 
        ? { ...u, ...userData }
        : u
    );
    setUsers(updatedUsers);
    setEditingUser(null);
    toast({
      title: "Usuário atualizado com sucesso!",
      description: `O usuário ${userData.name} foi atualizado.`,
    });
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "Usuário excluído",
      description: "O usuário foi removido do sistema.",
      variant: "destructive",
    });
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

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <div className="flex gap-2">
            <StudentForm onSubmit={(data) => console.log('Novo aluno:', data)} />
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'}>
                        {user.status}
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