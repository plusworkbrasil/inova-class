import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookOpen, Save, Users, Calculator, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useUsers } from '@/hooks/useUsers';
import { UserRole } from '@/types/user';

interface GradeEntry {
  studentId: string;
  value: number;
  observations?: string;
}

const SubjectGrades = () => {
  const { profile } = useAuth();
  const { createGrade, data: existingGrades } = useSupabaseGrades();
  const { data: classes } = useSupabaseClasses();
  const { data: subjects } = useSupabaseSubjects();
  const { users } = useUsers();
  const { toast } = useToast();

  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [gradeType, setGradeType] = useState('');
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxValue, setMaxValue] = useState(10);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Verificar permissões de acesso
  const canManageGrades = ['admin', 'secretary'].includes(userRole);

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

  // Filtrar alunos da turma selecionada
  const studentsInClass = selectedClass 
    ? users.filter(user => user.role === 'student' && user.class_id === selectedClass)
    : [];

  // Carregar alunos quando turma e disciplina forem selecionadas
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      const newGrades = studentsInClass.map(student => ({
        studentId: student.id,
        value: 0,
        observations: ''
      }));
      setGrades(newGrades);
    } else {
      setGrades([]);
    }
  }, [selectedClass, selectedSubject, users]);

  const updateGrade = (studentId: string, field: keyof GradeEntry, value: any) => {
    setGrades(prev => prev.map(grade => 
      grade.studentId === studentId 
        ? { ...grade, [field]: value }
        : grade
    ));
  };

  const handleSaveAllGrades = async () => {
    if (!selectedClass || !selectedSubject || !gradeType) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione turma, disciplina e tipo de avaliação."
      });
      return;
    }

    setLoading(true);
    try {
      const validGrades = grades.filter(grade => grade.value > 0);
      
      if (validGrades.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Insira pelo menos uma nota válida."
        });
        setLoading(false);
        return;
      }

      console.log('Dados para salvamento:', {
        selectedClass,
        selectedSubject,
        gradeType,
        gradeDate,
        maxValue,
        validGrades,
        profileId: profile?.id
      });

      // Salvar todas as notas uma por vez para melhor controle de erro
      let successCount = 0;
      for (const grade of validGrades) {
        try {
          const gradeData = {
            student_id: grade.studentId,
            subject_id: selectedSubject,
            value: Number(grade.value),
            max_value: Number(maxValue),
            date: gradeDate,
            teacher_id: profile?.id || '',
            type: gradeType,
            observations: grade.observations || null,
          };
          
          console.log('Salvando nota:', gradeData);
          
          await createGrade(gradeData);
          successCount++;
        } catch (gradeError) {
          console.error('Erro ao salvar nota individual:', gradeError);
          const studentName = getStudentName(grade.studentId);
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Erro ao salvar nota de ${studentName}: ${gradeError}`
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: "Sucesso!",
          description: `${successCount} de ${validGrades.length} notas foram lançadas com sucesso.`
        });

        // Limpar formulário apenas se houve sucesso
        setGrades(grades.map(grade => ({ ...grade, value: 0, observations: '' })));
      }
      
    } catch (error) {
      console.error('Erro geral ao criar notas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao salvar as notas: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedClassData = () => {
    return classes.find(cls => cls.id === selectedClass);
  };

  const getSelectedSubjectData = () => {
    return subjects.find(sub => sub.id === selectedSubject);
  };

  const getStudentName = (studentId: string) => {
    const student = users.find(user => user.id === studentId);
    return student?.name || 'N/A';
  };

  const getStudentNumber = (studentId: string) => {
    const student = users.find(user => user.id === studentId);
    return student?.student_id || 'N/A';
  };

  const gradeTypes = [
    { value: 'prova', label: 'Prova' },
    { value: 'trabalho', label: 'Trabalho' },
    { value: 'projeto', label: 'Projeto' },
    { value: 'avaliacao', label: 'Avaliação' },
    { value: 'exercicio', label: 'Exercício' },
    { value: 'test', label: 'Test' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'final', label: 'Final' }
  ];

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cadastro de Notas por Disciplina</h1>
            <p className="text-muted-foreground">Lance notas de todos os alunos de uma disciplina</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Administração Acadêmica
          </div>
        </div>

        {/* Configuração da Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Configurar Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Turma</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter(subject => !selectedClass || subject.class_id === selectedClass)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeType">Tipo de Avaliação</Label>
                <Select value={gradeType} onValueChange={setGradeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                   <SelectContent>
                     {gradeTypes.map((type) => (
                       <SelectItem key={type.value} value={type.value}>
                         {type.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeDate">Data</Label>
                <Input
                  id="gradeDate"
                  type="date"
                  value={gradeDate}
                  onChange={(e) => setGradeDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="maxValue">Nota Máxima</Label>
                <Input
                  id="maxValue"
                  type="number"
                  min="1"
                  max="100"
                  value={maxValue}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                />
              </div>
            </div>

            {selectedClass && selectedSubject && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Turma:</span>
                    <span>{getSelectedClassData()?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">Disciplina:</span>
                    <span>{getSelectedSubjectData()?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Alunos:</span>
                    <span>{studentsInClass.length}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Alunos para Notas */}
        {selectedClass && selectedSubject && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lançamento de Notas</CardTitle>
              <Button 
                onClick={handleSaveAllGrades}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Todas as Notas'}
              </Button>
            </CardHeader>
            <CardContent>
              {studentsInClass.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum aluno encontrado nesta turma.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead className="w-32">Nota</TableHead>
                      <TableHead className="w-40">Porcentagem</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsInClass.map((student) => {
                      const gradeEntry = grades.find(g => g.studentId === student.id);
                      const percentage = gradeEntry ? (gradeEntry.value / maxValue) * 100 : 0;
                      
                      return (
                         <TableRow key={student.id}>
                           <TableCell className="font-mono">
                             {(student as any).auto_student_id || student.student_id || 'N/A'}
                           </TableCell>
                           <TableCell className="font-medium">
                             {student.name}
                             {(student as any).auto_student_id && (
                               <span className="text-muted-foreground text-sm ml-2">
                                 (ID: {(student as any).auto_student_id})
                               </span>
                             )}
                           </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={maxValue}
                              step="0.1"
                              value={gradeEntry?.value || 0}
                              onChange={(e) => updateGrade(student.id, 'value', Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                percentage >= 80 ? 'default' : 
                                percentage >= 60 ? 'secondary' : 
                                percentage > 0 ? 'destructive' : 'outline'
                              }
                            >
                              {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Textarea
                              placeholder="Observações..."
                              value={gradeEntry?.observations || ''}
                              onChange={(e) => updateGrade(student.id, 'observations', e.target.value)}
                              className="min-h-[60px] resize-none"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SubjectGrades;