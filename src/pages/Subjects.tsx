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

const mockSubjectsData = [
  { 
    id: 1, 
    name: 'Matemática', 
    code: 'MAT001',
    teacher: 'Prof. João Silva',
    workload: 80,
    classes: ['1º Ano A', '1º Ano B'],
    status: 'ativo' 
  },
  { 
    id: 2, 
    name: 'Português', 
    code: 'POR001',
    teacher: 'Prof. Maria Santos',
    workload: 80,
    classes: ['1º Ano A', '2º Ano A'],
    status: 'ativo' 
  },
  { 
    id: 3, 
    name: 'História', 
    code: 'HIS001',
    teacher: 'Prof. Ana Costa',
    workload: 60,
    classes: ['2º Ano B', '3º Ano A'],
    status: 'ativo' 
  },
  { 
    id: 4, 
    name: 'Física', 
    code: 'FIS001',
    teacher: 'Prof. Pedro Oliveira',
    workload: 60,
    classes: ['3º Ano A'],
    status: 'inativo' 
  },
];

const Subjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjects, setSubjects] = useState(mockSubjectsData);
  const { toast } = useToast();

  const handleCreateSubject = (data: any) => {
    const newSubject = {
      id: subjects.length + 1,
      name: data.name,
      code: data.code,
      teacher: data.teacher,
      workload: data.workload,
      classes: data.classes,
      status: data.status,
      description: data.description,
    };
    setSubjects([...subjects, newSubject]);
    toast({
      title: "Disciplina criada com sucesso!",
      description: `A disciplina ${data.name} foi criada.`,
    });
  };

  const handleEditSubject = (subjectData: any) => {
    const updatedSubjects = subjects.map(s => 
      s.id === editingSubject.id 
        ? { ...s, ...subjectData }
        : s
    );
    setSubjects(updatedSubjects);
    setEditingSubject(null);
    toast({
      title: "Disciplina atualizada com sucesso!",
      description: `A disciplina ${subjectData.name} foi atualizada.`,
    });
  };

  const handleDeleteSubject = (subjectId: number) => {
    setSubjects(subjects.filter(s => s.id !== subjectId));
    toast({
      title: "Disciplina excluída",
      description: "A disciplina foi removida do sistema.",
      variant: "destructive",
    });
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

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
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
                  <p className="text-3xl font-bold text-primary">4</p>
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
                  <p className="text-3xl font-bold text-success">3</p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carga Horária Total</p>
                  <p className="text-3xl font-bold text-info">280h</p>
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
                  <p className="text-3xl font-bold text-warning">4</p>
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
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{subject.teacher}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {subject.workload}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subject.classes.map((className, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {className}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.status === 'ativo' ? 'default' : 'secondary'}>
                        {subject.status}
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