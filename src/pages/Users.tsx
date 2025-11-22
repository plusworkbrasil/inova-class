import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Edit, Trash2, Eye, Key, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { UserRole } from '@/types/user';
import { StudentForm } from '@/components/forms/StudentForm';
import { UserForm } from '@/components/forms/UserForm';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserDetailsDialog } from '@/components/ui/user-details-dialog';
import { PasswordUpdateDialog } from '@/components/ui/password-update-dialog';
import { roleTranslations, getRoleTranslation } from '@/lib/roleTranslations';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

const Users = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<any>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  
  const { 
    users, 
    loading,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus,
    nextPage,
    prevPage,
    goToPage,
    fetchUsers
  } = useUsers();
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Buscar quando filtros mudarem (com debounce para search)
  useEffect(() => {
    fetchUsers(1, debouncedSearch, selectedRole, selectedStatus);
  }, [debouncedSearch, selectedRole, selectedStatus]);

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

  const handleEditUser = async (userData: any, userId: string) => {
    await updateUser(userId, {
      name: userData.name,
      email: userData.email,
      role: userData.role as 'admin' | 'secretary' | 'instructor' | 'student',
      class_id: userData.class_id,
      phone: userData.phone,
      birth_date: userData.birth_date,
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

  const handleToggleStatus = (user: any) => {
    if (user.status === 'active') {
      setDeactivatingUser(user);
      setIsDeactivateDialogOpen(true);
    } else {
      toggleUserStatus(user.id, user.status);
    }
  };

  const confirmDeactivate = async () => {
    if (deactivatingUser) {
      await toggleUserStatus(deactivatingUser.id, deactivatingUser.status);
      setIsDeactivateDialogOpen(false);
      setDeactivatingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'coordinator': return 'default';
      case 'instructor': return 'secondary';
      case 'secretary': return 'outline';
      case 'tutor': return 'secondary';
      case 'student': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'evaded':
        return <Badge variant="destructive">Evadido</Badge>;
      default:
        return <Badge variant="default">Ativo</Badge>;
    }
  };

  const clearFilters = () => {
    setSelectedRole('');
    setSelectedStatus('');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedRole || selectedStatus || searchTerm;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <div className="flex gap-2">
            <StudentForm onSubmit={handleCreateStudent} />
            <UserForm onSubmit={handleCreateUser} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="secretary">Secretaria</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="instructor">Instrutor</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="evaded">Evadido</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full md:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 text-sm text-muted-foreground">
                Filtros ativos: {[
                  searchTerm && `Busca: "${searchTerm}"`,
                  selectedRole && `Perfil: ${getRoleTranslation(selectedRole as UserRole)}`,
                  selectedStatus && `Status: ${selectedStatus === 'active' ? 'Ativo' : selectedStatus === 'inactive' ? 'Inativo' : 'Evadido'}`
                ].filter(Boolean).join(' • ')}
              </div>
            )}
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
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                         <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                           {roleTranslations[user.role as UserRole] || user.role}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         {getStatusBadge(user.status)}
                       </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <Switch
                                    checked={user.status === 'active'}
                                    onCheckedChange={() => handleToggleStatus(user)}
                                    disabled={user.id === profile?.id}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {user.id === profile?.id 
                                    ? 'Você não pode desativar sua própria conta' 
                                    : user.status === 'active' 
                                      ? 'Desativar usuário' 
                                      : 'Ativar usuário'
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openViewDialog(user)}
                          >
                            <Eye size={14} />
                          </Button>
                          <UserForm 
                            onSubmit={(userData) => handleEditUser(userData, user.id)}
                            initialData={{
                              ...user,
                              birth_date: user.birth_date ? new Date(user.birth_date) : undefined
                            } as any}
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
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Controles de Paginação */}
            {!loading && totalCount > 0 && (
              <div className="flex items-center justify-between py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando <strong>{startIndex}-{endIndex}</strong> de{' '}
                  <strong>{totalCount}</strong> usuários
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => prevPage(debouncedSearch, selectedRole, selectedStatus)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page, debouncedSearch, selectedRole, selectedStatus)}
                          disabled={loading}
                          className="w-9 h-9 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextPage(debouncedSearch, selectedRole, selectedStatus)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
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
        
        <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar o usuário{' '}
                <strong>{deactivatingUser?.name}</strong>?
                <br /><br />
                O usuário não poderá mais fazer login no sistema até ser reativado.
                Você pode reativá-lo a qualquer momento clicando no mesmo botão.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeactivate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Users;