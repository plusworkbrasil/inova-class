import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, BookOpen, Clock, User } from 'lucide-react';
import { SubjectForm } from '@/components/forms/SubjectForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useUsers } from '@/hooks/useUsers';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useRealClassData } from '@/hooks/useRealClassData';

const Subjects = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Use Supabase hooks
  const { data: subjects, loading, createSubject, updateSubject, deleteSubject } = useSupabaseSubjects();
  const { users } = useUsers();
  const { data: classes } = useSupabaseClasses();
  const { stats: classStats } = useRealClassData();

  // Helper functions to get names from IDs
  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return 'Não atribuído';
    const teacher = users.find(user => user.id === teacherId);
    return teacher?.name || 'Não encontrado';
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return 'Sem turma';
    const classItem = classes.find(cls => cls.id === classId);
    return classItem?.name || 'Não encontrada';
  };

  const handleCreateSubject = async (data: any) => {
    try {
      await createSubject({
        name: data.name,
        code: data.code,
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        workload: data.workload,
        description: data.description,
        status: data.status,
      });
      
      toast({
        title: "Disciplina criada com sucesso!",
        description: `A disciplina ${data.name} foi criada.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditSubject = async (subjectData: any) => {
    if (!editingSubject) return;
    
    try {
      await updateSubject(editingSubject.id, {
        name: subjectData.name,
        code: subjectData.code,
        teacher_id: subjectData.teacher_id,
        class_id: subjectData.class_id,
        workload: subjectData.workload,
        description: subjectData.description,
        status: subjectData.status,
      });
      
      setEditingSubject(null);
      toast({
        title: "Disciplina atualizada com sucesso!",
        description: `A disciplina ${subjectData.name} foi atualizada.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId);
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi removida do sistema.",
        variant: "destructive",
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const openDeleteDialog = (subject: any) => {
    setDeletingSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const openEditForm = (subject: any) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Disciplinas</h1>
          <Button className="flex items-center gap-2" onClick={openCreateForm}>
            <Plus size={16} />
            Nova Disciplina
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Disciplinas</p>
                  <p className="text-3xl font-bold text-primary">{subjects.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disciplinas Ativas</p>
                  <p className="text-3xl font-bold text-success">{subjects.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instrutores</p>
                  <p className="text-3xl font-bold text-warning">{classStats.totalInstructors}</p>
                </div>
                <User className="h-8 w-8 text-warning" />
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
                  placeholder="Buscar disciplina..."
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
            <CardTitle>Lista de Disciplinas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                     <TableCell className="font-medium">{subject.name}</TableCell>
                     <TableCell>{getTeacherName(subject.teacher_id)}</TableCell>
                     <TableCell>
                       <Badge variant="outline" className="text-xs">
                         {getClassName(subject.class_id)}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant={subject.status === 'ativo' ? 'default' : 'secondary'}>
                         {subject.status === 'ativo' ? 'Ativo' : 'Inativo'}
                       </Badge>
                     </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditForm(subject)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(subject)}
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
        
        <SubjectForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingSubject ? handleEditSubject : handleCreateSubject}
          initialData={editingSubject}
          mode={editingSubject ? 'edit' : 'create'}
        />
        
        <DeleteConfirmation
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => handleDeleteSubject(deletingSubject?.id)}
          title="Excluir Disciplina"
          description="Esta ação não pode ser desfeita. A disciplina será permanentemente removida do sistema."
          itemName={deletingSubject?.name}
        />
      </div>
    </Layout>
  );
};

export default Subjects;