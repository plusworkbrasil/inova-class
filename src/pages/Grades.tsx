import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, BookOpen, Users, TrendingUp, AlertTriangle, GraduationCap } from 'lucide-react';
import { GradeForm } from '@/components/forms/GradeForm';
import { InstructorGradesBySubjectForm } from '@/components/forms/InstructorGradesBySubjectForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useUsers } from '@/hooks/useUsers';
import { UserRole } from '@/types/user';

const Grades = () => {
  const { profile } = useAuth();
  const { data: grades, loading: gradesLoading, createGrade, updateGrade } = useSupabaseGrades();
  const { data: classes } = useSupabaseClasses();
  const { data: subjects } = useSupabaseSubjects();
  const { users } = useUsers();
  const { toast } = useToast();

  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [isSubjectGradeFormOpen, setIsSubjectGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);

  // Verificar permissões de acesso
  const canManageGrades = ['admin', 'secretary', 'instructor'].includes(userRole);

  if (!canManageGrades) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Função para buscar dados do estudante
  const getStudentData = (studentId: string) => {
    return users.find(user => user.id === studentId);
  };

  // Função para buscar dados da disciplina
  const getSubjectData = (subjectId: string) => {
    return subjects.find(subject => subject.id === subjectId);
  };

  // Função para buscar dados da turma
  const getClassData = (classId: string) => {
    return classes.find(cls => cls.id === classId);
  };

  // Função para buscar dados do professor
  const getTeacherData = (teacherId: string) => {
    return users.find(user => user.id === teacherId);
  };

  const handleCreateGrade = async (data: any) => {
    try {
      await createGrade({
        student_id: data.student_id,
        subject_id: data.subject_id,
        value: data.grade,
        max_value: data.maxGrade,
        date: data.date,
        teacher_id: profile?.id || '',
        type: data.type,
        observations: data.observations,
      });
    } catch (error) {
      console.error('Error creating grade:', error);
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
      console.error('Error creating multiple grades:', error);
      toast({
        variant: "destructive",
        title: "Erro ao lançar notas",
        description: "Ocorreu um erro ao salvar as notas.",
      });
    }
  };

  const handleEditGrade = async (data: any) => {
    if (!editingGrade) return;
    
    try {
      await updateGrade(editingGrade.id, {
        value: data.grade,
        max_value: data.maxGrade,
        date: data.date,
        type: data.type,
        observations: data.observations,
      });
      setEditingGrade(null);
    } catch (error) {
      console.error('Error updating grade:', error);
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
  const totalGrades = grades.length;
  const averageGrade = totalGrades > 0 ? grades.reduce((sum, grade) => sum + grade.value, 0) / totalGrades : 0;
  const failingGrades = grades.filter(grade => (grade.value / grade.max_value) * 100 < 60).length;
  const subjectsCount = new Set(grades.map(grade => grade.subject_id)).size;

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'instructor' ? 'Minhas Notas' : 'Gerenciamento de Notas'}
          </h1>
          <div className="flex gap-2">
            {userRole === 'instructor' && (
              <Button className="flex items-center gap-2" onClick={() => setIsSubjectGradeFormOpen(true)}>
                <GraduationCap size={16} />
                Lançar Notas por Disciplina
              </Button>
            )}
            <Button className="flex items-center gap-2" onClick={openCreateForm}>
              <Plus size={16} />
              Lançar Nota Individual
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Notas</p>
                  <p className="text-3xl font-bold text-primary">{gradesLoading ? '...' : totalGrades}</p>
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
                  <p className="text-3xl font-bold text-success">
                    {gradesLoading ? '...' : (totalGrades > 0 ? averageGrade.toFixed(1) : '0.0')}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disciplinas</p>
                  <p className="text-3xl font-bold text-info">{gradesLoading ? '...' : subjectsCount}</p>
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
                  <p className="text-3xl font-bold text-warning">{gradesLoading ? '...' : failingGrades}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
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
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">Filtrar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Notas</CardTitle>
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
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradesLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Carregando notas...
                    </TableCell>
                  </TableRow>
                ) : grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Nenhuma nota encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((grade) => {
                    const student = getStudentData(grade.student_id);
                    const subject = getSubjectData(grade.subject_id);
                    const teacher = getTeacherData(grade.teacher_id);
                    const studentClass = student?.class_id ? getClassData(student.class_id) : null;

                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{student?.name || 'N/A'}</TableCell>
                        <TableCell>{student?.student_id || 'N/A'}</TableCell>
                        <TableCell>{studentClass?.name || 'N/A'}</TableCell>
                        <TableCell>{subject?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(grade.type)}`}>
                            {grade.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getGradeBadgeVariant(grade.value, grade.max_value)}>
                            {grade.value.toFixed(1)}/{grade.max_value.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(grade.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{teacher?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditForm(grade)}
                            >
                              <Edit size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <GradeForm
          open={isGradeFormOpen}
          onOpenChange={setIsGradeFormOpen}
          onSubmit={editingGrade ? handleEditGrade : handleCreateGrade}
          initialData={editingGrade}
          mode={editingGrade ? 'edit' : 'create'}
          userRole={userRole}
          currentUser={profile}
        />
        
        <InstructorGradesBySubjectForm
          open={isSubjectGradeFormOpen}
          onOpenChange={setIsSubjectGradeFormOpen}
          onSubmit={handleCreateMultipleGrades}
          onUpdate={handleEditGrade}
        />
      </div>
    </Layout>
  );
};

export default Grades;