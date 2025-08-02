import { useState } from 'react';
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

const mockClassesData = [
  { 
    id: 1, 
    name: '1º Ano A', 
    period: 'Manhã', 
    students: 28, 
    coordinator: 'Maria Santos',
    subjects: 8,
    status: 'ativo' 
  },
  { 
    id: 2, 
    name: '2º Ano B', 
    period: 'Tarde', 
    students: 32, 
    coordinator: 'João Silva',
    subjects: 9,
    status: 'ativo' 
  },
  { 
    id: 3, 
    name: '3º Ano A', 
    period: 'Manhã', 
    students: 25, 
    coordinator: 'Ana Costa',
    subjects: 10,
    status: 'ativo' 
  },
  { 
    id: 4, 
    name: '1º Ano C', 
    period: 'Noite', 
    students: 20, 
    coordinator: 'Pedro Oliveira',
    subjects: 8,
    status: 'inativo' 
  },
];

const Classes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [deletingClass, setDeletingClass] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classes, setClasses] = useState(mockClassesData);
  const { toast } = useToast();

  const handleCreateClass = (data: any) => {
    const newClass = {
      id: classes.length + 1,
      name: data.name,
      period: data.period,
      students: 0,
      coordinator: data.coordinator,
      subjects: 0,
      status: data.status,
      grade: data.grade,
      year: data.year,
    };
    setClasses([...classes, newClass]);
    toast({
      title: "Turma criada com sucesso!",
      description: `A turma ${data.name} foi criada.`,
    });
  };

  const handleEditClass = (classData: any) => {
    const updatedClasses = classes.map(c => 
      c.id === editingClass.id 
        ? { ...c, ...classData }
        : c
    );
    setClasses(updatedClasses);
    setEditingClass(null);
    toast({
      title: "Turma atualizada com sucesso!",
      description: `A turma ${classData.name} foi atualizada.`,
    });
  };

  const handleDeleteClass = (classId: number) => {
    setClasses(classes.filter(c => c.id !== classId));
    toast({
      title: "Turma excluída",
      description: "A turma foi removida do sistema.",
      variant: "destructive",
    });
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

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
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
                  <p className="text-3xl font-bold text-primary">4</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                  <p className="text-3xl font-bold text-info">105</p>
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
                  <p className="text-3xl font-bold text-warning">26</p>
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
                  <TableHead>Período</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        {classItem.students}
                      </div>
                    </TableCell>
                    <TableCell>{classItem.coordinator}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} />
                        {classItem.subjects}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={classItem.status === 'ativo' ? 'default' : 'secondary'}>
                        {classItem.status}
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