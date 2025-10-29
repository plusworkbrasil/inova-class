import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, BookOpen, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { GradeForm } from '@/components/forms/GradeForm';
import { InstructorGradesBySubjectForm } from '@/components/forms/InstructorGradesBySubjectForm';
import { GradesByClassGroup } from '@/components/grades/GradesByClassGroup';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useInstructorSubjects } from '@/hooks/useInstructorSubjects';
import { useInstructorClasses } from '@/hooks/useInstructorClasses';
import { UserRole } from '@/types/user';

const TeacherGrades = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [isInstructorGradeFormOpen, setIsInstructorGradeFormOpen] = useState(false);
  const { toast } = useToast();
  
  // Hooks para dados reais
  const { profile, loading: authLoading } = useAuth();
  const { data: grades, createGrade, updateGrade, refetch } = useSupabaseGrades();
  const { subjects: instructorSubjects, loading: subjectsLoading } = useInstructorSubjects();
  const { classes: instructorClasses, loading: classesLoading } = useInstructorClasses();

  // Filtrar notas das disciplinas do instrutor
  const instructorGrades = grades?.filter(grade => 
    instructorSubjects?.some(subject => subject.id === grade.subject_id)
  ) || [];

  const handleCreateGrade = async (data: any) => {
    try {
      await createGrade({
        student_id: data.studentId,
        subject_id: data.subjectId,
        value: data.grade,
        max_value: data.maxGrade,
        date: data.date,
        teacher_id: profile?.id || '',
        type: data.type,
        observations: data.observations || ''
      });
      toast({
        title: "Nota lançada com sucesso!",
        description: `Nota ${data.grade} registrada com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao lançar nota.",
      });
    }
  };

  const handleEditGrade = async (gradeData: any) => {
    try {
      await updateGrade(editingGrade.id, {
        value: gradeData.grade,
        max_value: gradeData.maxGrade,
        date: gradeData.date,
        type: gradeData.type,
        observations: gradeData.observations || ''
      });
      setEditingGrade(null);
      toast({
        title: "Nota atualizada com sucesso!",
        description: "Nota foi atualizada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar nota.",
      });
    }
  };

  const handleCreateMultipleGrades = async (gradesData: any[]) => {
    try {
      for (const gradeData of gradesData) {
        await createGrade(gradeData);
      }
      toast({
        title: "Notas lançadas com sucesso!",
        description: `${gradesData.length} notas foram adicionadas.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao lançar notas em lote.",
      });
    }
  };

  const handleUpdateGrade = async (gradeId: string, data: any) => {
    try {
      await updateGrade(gradeId, data);
      toast({
        title: "Nota atualizada!",
        description: "A nota foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar nota.",
      });
    }
  };

  const openEditForm = (grade: any) => {
    setEditingGrade(grade);
    setIsGradeFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingGrade(null);
    setIsGradeFormOpen(true);
  };

  const openBatchGradeForm = () => {
    setIsInstructorGradeFormOpen(true);
  };

  const getGradeBadgeVariant = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prova': return 'bg-blue-100 text-blue-800';
      case 'trabalho': return 'bg-green-100 text-green-800';
      case 'seminário': return 'bg-purple-100 text-purple-800';
      case 'projeto': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular estatísticas com dados reais
  const totalGrades = instructorGrades.length;
  const averageGrade = totalGrades > 0 ? 
    instructorGrades.reduce((sum, grade) => sum + Number(grade.value), 0) / totalGrades : 0;
  const failingGrades = instructorGrades.filter(grade => (Number(grade.value) / Number(grade.max_value)) * 100 < 60).length;
  const subjectsCount = instructorSubjects?.length || 0;

  // Filtrar dados baseado na busca e filtros
  const filteredGrades = instructorGrades.filter(grade => {
    const subject = instructorSubjects?.find(s => s.id === grade.subject_id);
    const matchesSearch = searchTerm === '' || 
      grade.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === '' || 
      (subject && instructorClasses?.find(c => c.id === subject.class_id)?.name === selectedClass);
    const matchesSubject = selectedSubject === '' || 
      (subject && subject.name === selectedSubject);
    
    return matchesSearch && matchesClass && matchesSubject;
  });

  if (authLoading || subjectsLoading || classesLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Layout 
      userRole={((profile?.role === 'teacher' ? 'instructor' : profile?.role) || 'instructor') as UserRole}
      userName={profile?.name || 'Instrutor'}
      userAvatar=""
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Minhas Notas</h1>
          <div className="flex gap-2">
            <Button onClick={openBatchGradeForm} size="lg">
              <Users size={18} className="mr-2" />
              Lançar Notas por Turma
            </Button>
            <Button variant="outline" onClick={openCreateForm}>
              <Plus size={16} className="mr-2" />
              Nota Individual
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Notas</p>
                  <p className="text-3xl font-bold text-primary">{totalGrades}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold text-success">{averageGrade.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minhas Disciplinas</p>
                  <p className="text-3xl font-bold text-info">{subjectsCount}</p>
                </div>
                <BookOpen className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notas Baixas</p>
                  <p className="text-3xl font-bold text-warning">{failingGrades}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lançamento Rápido de Notas</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione uma disciplina para lançar notas de toda a turma de uma vez.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructorSubjects?.map(subject => {
                const subjectClass = instructorClasses?.find(c => c.id === subject.class_id);
                return (
                  <div key={subject.id} className="space-y-3">
                    <h4 className="font-semibold text-lg text-primary">{subject.name}</h4>
                    <div className="space-y-2">
                      {subjectClass && (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                          <div>
                            <p className="font-medium">{subjectClass.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Ano: {subjectClass.year} • {subject.student_count || 0} alunos
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={openBatchGradeForm}
                          >
                            Lançar Notas
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas Disciplinas e Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Disciplinas:</h4>
                <div className="flex flex-wrap gap-2">
                  {instructorSubjects?.map(subject => (
                    <Badge key={subject.id} variant="secondary">{subject.name}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Turmas:</h4>
                <div className="flex flex-wrap gap-2">
                  {instructorClasses?.map(classItem => (
                    <Badge key={classItem.id} variant="outline">{classItem.name}</Badge>
                  ))}
                </div>
              </div>
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
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {instructorClasses?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.name}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {instructorSubjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas por Turma e Disciplina</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Visualização agrupada das avaliações por turma. Clique para expandir e ver os detalhes de cada aluno.
            </p>
          </CardHeader>
          <CardContent>
            <GradesByClassGroup
              grades={instructorGrades}
              subjects={instructorSubjects || []}
              classes={instructorClasses || []}
              onEditGroup={(subjectId, type, date) => {
                // TODO: Implementar abertura do formulário de edição com dados pré-preenchidos
                openBatchGradeForm();
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Notas Lançadas</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Visualização detalhada de todas as notas já registradas. Use "Lançar Notas por Turma" acima para registrar múltiplas notas de uma vez.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => {
                  const subject = instructorSubjects?.find(s => s.id === grade.subject_id);
                  const classItem = instructorClasses?.find(c => c.id === subject?.class_id);
                  return (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.student_name || 'N/A'}</TableCell>
                      <TableCell>{grade.student_enrollment || grade.student_number || 'N/A'}</TableCell>
                      <TableCell>{classItem?.name || 'N/A'}</TableCell>
                      <TableCell>{subject?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(grade.type)}`}>
                          {grade.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getGradeBadgeVariant(Number(grade.value), Number(grade.max_value))}>
                          {grade.value}/{grade.max_value}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(grade.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditForm(grade)}
                        >
                          <Edit size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <InstructorGradesBySubjectForm
          open={isInstructorGradeFormOpen}
          onOpenChange={setIsInstructorGradeFormOpen}
          onSubmit={handleCreateMultipleGrades}
          onUpdate={handleUpdateGrade}
        />

        <GradeForm
          open={isGradeFormOpen}
          onOpenChange={setIsGradeFormOpen}
          onSubmit={editingGrade ? handleEditGrade : handleCreateGrade}
          initialData={editingGrade}
          mode={editingGrade ? 'edit' : 'create'}
          userRole="teacher"
          currentUser={profile}
        />
      </div>
    </Layout>
  );
};

export default TeacherGrades;