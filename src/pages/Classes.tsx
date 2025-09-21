import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import { ClassForm } from '@/components/forms/ClassForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';

const Classes = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [deletingClass, setDeletingClass] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: classes, loading, createClass, updateClass, deleteClass } = useSupabaseClasses();

  const handleCreateClass = async (data: any) => {
    try {
      await createClass({
        name: data.name,
        year: data.year,
      });
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleEditClass = async (classData: any) => {
    if (!editingClass) return;
    
    try {
      await updateClass(editingClass.id, {
        name: classData.name,
        year: classData.year,
      });
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClass(classId);
    } catch (error) {
      console.error('Error deleting class:', error);
    }
    setDeletingClass(null);
    setIsDeleteDialogOpen(false);
  };

  const openDeleteDialog = (classItem: any) => {
    setDeletingClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const openEditForm = (classItem: any) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

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
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Turmas</h1>
          <Button className="flex items-center gap-2" onClick={openCreateForm}>
            <Plus size={16} />
            Nova Turma
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Turmas</p>
                  <p className="text-3xl font-bold text-primary">{classes.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turmas Ativas</p>
                  <p className="text-3xl font-bold text-success">{classes.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                  <p className="text-3xl font-bold text-info">-</p>
                </div>
                <Users className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média por Turma</p>
                  <p className="text-3xl font-bold text-warning">-</p>
                </div>
                <Users className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
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
                  placeholder="Buscar turma..."
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
            <CardTitle>Lista de Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {classes.filter(c => 
                  c.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.year || '-'}</TableCell>
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
                          onClick={() => openEditForm(classItem)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(classItem)}
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
        
        <ClassForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingClass ? handleEditClass : handleCreateClass}
          initialData={editingClass}
          mode={editingClass ? 'edit' : 'create'}
        />
        
        <DeleteConfirmation
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => handleDeleteClass(deletingClass?.id)}
          title="Excluir Turma"
          description="Esta ação não pode ser desfeita. A turma será permanentemente removida do sistema."
          itemName={deletingClass?.name}
        />
      </div>
    </Layout>
  );
};

export default Classes;