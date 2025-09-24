import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, BookOpen, Clock, User, Calendar } from 'lucide-react';
import { SubjectForm } from '@/components/forms/SubjectForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useUsers } from '@/hooks/useUsers';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useRealClassData } from '@/hooks/useRealClassData';
import { cn } from '@/lib/utils';

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

  // Função para agrupar disciplinas por turma
  const getSubjectsByClass = () => {
    const subjectsByClass: Record<string, any[]> = {};
    
    filteredSubjects.forEach(subject => {
      const className = getClassName(subject.class_id);
      if (!subjectsByClass[className]) {
        subjectsByClass[className] = [];
      }
      subjectsByClass[className].push(subject);
    });
    
    return subjectsByClass;
  };

  // Função para verificar se a disciplina está ativa no momento
  const isSubjectActive = (subject: any) => {
    const now = new Date();
    const startDate = (subject as any).start_date ? new Date((subject as any).start_date) : null;
    const endDate = (subject as any).end_date ? new Date((subject as any).end_date) : null;
    
    if (!startDate && !endDate) return subject.status === 'ativo';
    if (!startDate) return now <= endDate && subject.status === 'ativo';
    if (!endDate) return now >= startDate && subject.status === 'ativo';
    
    return now >= startDate && now <= endDate && subject.status === 'ativo';
  };

  const handleCreateSubject = async (data: any) => {
    try {
      const subjectData: any = {
        name: data.name,
        code: data.code,
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        workload: data.workload,
        description: data.description,
        status: data.status,
      };

      if (data.start_date) {
        subjectData.start_date = data.start_date.toISOString().split('T')[0];
      }
      if (data.end_date) {
        subjectData.end_date = data.end_date.toISOString().split('T')[0];
      }

      await createSubject(subjectData);
      
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
      const updateData: any = {
        name: subjectData.name,
        code: subjectData.code,
        teacher_id: subjectData.teacher_id,
        class_id: subjectData.class_id,
        workload: subjectData.workload,
        description: subjectData.description,
        status: subjectData.status,
      };

      if (subjectData.start_date) {
        updateData.start_date = subjectData.start_date.toISOString().split('T')[0];
      }
      if (subjectData.end_date) {
        updateData.end_date = subjectData.end_date.toISOString().split('T')[0];
      }

      await updateSubject(editingSubject.id, updateData);
      
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
                  <p className="text-3xl font-bold text-success">{subjects.filter(s => s.status === 'ativo').length}</p>
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
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Disciplinas por Curso/Turma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(getSubjectsByClass()).map(([className, classSubjects]) => (
                <div key={className} className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {className}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({classSubjects.length} disciplina{classSubjects.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classSubjects.map((subject) => (
                      <div 
                        key={subject.id} 
                        className={cn(
                          "border rounded-md p-3 bg-background transition-colors",
                          isSubjectActive(subject) 
                            ? "border-success bg-success/5" 
                            : "border-border"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{subject.name}</h4>
                          <Badge 
                            variant={isSubjectActive(subject) ? "default" : "secondary"}
                          >
                            {isSubjectActive(subject) ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        {subject.code && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Código: {subject.code}
                          </p>
                        )}
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{getTeacherName(subject.teacher_id)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{subject.workload}h de carga horária</span>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            {(subject as any).start_date && (
                              <div className="flex items-center gap-1 text-success">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Início: {new Date((subject as any).start_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                            
                            {(subject as any).end_date && (
                              <div className="flex items-center gap-1 text-warning">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Término: {new Date((subject as any).end_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                            
                            {!(subject as any).start_date && !(subject as any).end_date && (
                              <div className="text-muted-foreground">
                                Período não definido
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {classSubjects.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhuma disciplina encontrada para esta turma
                    </p>
                  )}
                </div>
              ))}
              
              {Object.keys(getSubjectsByClass()).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma disciplina cadastrada ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                  <TableHead>Turmas</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                     <TableCell className="font-medium">
                       <div>
                         <p className="font-medium">{subject.name}</p>
                         {subject.code && (
                           <p className="text-sm text-muted-foreground">{subject.code}</p>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>{getTeacherName(subject.teacher_id)}</TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         <Badge variant="outline" className="text-xs">
                           {getClassName(subject.class_id)}
                         </Badge>
                         {subject.class_id && (
                           <div className="text-xs text-muted-foreground">
                             <Clock className="w-3 h-3 inline mr-1" />
                             {subject.workload}h
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         {(subject as any).start_date && (
                           <div className="text-xs flex items-center">
                             <Calendar className="w-3 h-3 mr-1" />
                             {new Date((subject as any).start_date).toLocaleDateString('pt-BR')}
                           </div>
                         )}
                         {(subject as any).end_date && (
                           <div className="text-xs text-muted-foreground">
                             até {new Date((subject as any).end_date).toLocaleDateString('pt-BR')}
                           </div>
                         )}
                         {!(subject as any).start_date && !(subject as any).end_date && (
                           <span className="text-xs text-muted-foreground">Não definido</span>
                         )}
                       </div>
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