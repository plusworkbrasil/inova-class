import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

const Subjects = () => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Recuperar dados do usuário do localStorage
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }
    
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          teacher:profiles!subjects_teacher_id_fkey(name),
          class:classes!subjects_class_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      toast({
        title: "Erro ao carregar disciplinas",
        description: "Não foi possível carregar as disciplinas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (data: any) => {
    try {
      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert([{
          name: data.name,
          teacher_id: data.teacher_id,
          class_id: data.class_id,
        }])
        .select(`
          *,
          teacher:profiles!subjects_teacher_id_fkey(name),
          class:classes!subjects_class_id_fkey(name)
        `)
        .single();

      if (error) throw error;

      setSubjects([newSubject, ...subjects]);
      toast({
        title: "Disciplina criada com sucesso!",
        description: `A disciplina ${data.name} foi criada.`,
      });
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      toast({
        title: "Erro ao criar disciplina",
        description: "Não foi possível criar a disciplina.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubject = async (subjectData: any) => {
    try {
      const { data: updatedSubject, error } = await supabase
        .from('subjects')
        .update({
          name: subjectData.name,
          teacher_id: subjectData.teacher_id,
          class_id: subjectData.class_id,
        })
        .eq('id', editingSubject.id)
        .select(`
          *,
          teacher:profiles!subjects_teacher_id_fkey(name),
          class:classes!subjects_class_id_fkey(name)
        `)
        .single();

      if (error) throw error;

      setSubjects(subjects.map(s => s.id === editingSubject.id ? updatedSubject : s));
      setEditingSubject(null);
      toast({
        title: "Disciplina atualizada com sucesso!",
        description: `A disciplina ${subjectData.name} foi atualizada.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      toast({
        title: "Erro ao atualizar disciplina",
        description: "Não foi possível atualizar a disciplina.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      setSubjects(subjects.filter(s => s.id !== subjectId));
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi removida do sistema.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      toast({
        title: "Erro ao excluir disciplina",
        description: "Não foi possível excluir a disciplina.",
        variant: "destructive",
      });
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-sm font-medium text-muted-foreground">Classes Cobertas</p>
                  <p className="text-3xl font-bold text-info">{new Set(subjects.map(s => s.class_id)).size}</p>
                </div>
                <Clock className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instrutores</p>
                  <p className="text-3xl font-bold text-warning">{new Set(subjects.map(s => s.teacher_id)).size}</p>
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
                  <TableHead>Código</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{subject.teacher?.name || 'Não atribuído'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        -
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {subject.class?.name || 'Sem turma'}
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