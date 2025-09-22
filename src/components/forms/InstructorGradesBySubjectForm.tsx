import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Edit } from 'lucide-react';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const gradeFormSchema = z.object({
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  type: z.string().min(1, 'Tipo de avaliação é obrigatório'),
  maxGrade: z.number().min(1, 'Nota máxima deve ser maior que 0'),
  date: z.string().min(1, 'Data é obrigatória'),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface Student {
  id: string;
  name: string;
  student_id: string;
  class_id: string;
}

interface ExistingGrade {
  id: string;
  student_id: string;
  value: number;
  type: string;
  date: string;
}

interface InstructorGradesBySubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any[]) => void;
  onUpdate: (gradeId: string, data: any) => void;
}

export const InstructorGradesBySubjectForm: React.FC<InstructorGradesBySubjectFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onUpdate
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [existingGrades, setExistingGrades] = useState<ExistingGrade[]>([]);
  const [studentGrades, setStudentGrades] = useState<{ [key: string]: number }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const { data: subjects } = useSupabaseSubjects();
  const { profile } = useAuth();
  const { toast } = useToast();

  // Filtrar disciplinas do instrutor
  const instructorSubjects = subjects?.filter(subject => 
    subject.teacher_id === profile?.id || 
    profile?.instructor_subjects?.includes(subject.name)
  ) || [];

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      subjectId: '',
      type: '',
      maxGrade: 10,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Buscar alunos da disciplina selecionada
  const fetchStudentsFromSubject = async (subjectId: string) => {
    if (!subjectId) return;
    
    setLoadingStudents(true);
    try {
      const subject = subjects?.find(s => s.id === subjectId);
      if (!subject?.class_id) {
        setStudents([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id, class_id')
        .eq('class_id', subject.class_id)
        .eq('role', 'student');
      
      if (error) throw error;
      setStudents(data || []);
      setSelectedSubject(subject);
      
      // Buscar notas existentes para esta disciplina
      await fetchExistingGrades(subjectId, data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Buscar notas existentes
  const fetchExistingGrades = async (subjectId: string, studentsList: Student[]) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('id, student_id, value, type, date')
        .eq('subject_id', subjectId)
        .in('student_id', studentsList.map(s => s.id));
      
      if (error) throw error;
      setExistingGrades(data || []);
    } catch (error) {
      console.error('Erro ao buscar notas existentes:', error);
      setExistingGrades([]);
    }
  };

  useEffect(() => {
    const subjectId = form.watch('subjectId');
    if (subjectId) {
      fetchStudentsFromSubject(subjectId);
    } else {
      setStudents([]);
      setExistingGrades([]);
      setSelectedSubject(null);
    }
  }, [form.watch('subjectId')]);

  const handleGradeChange = (studentId: string, grade: string) => {
    const numericGrade = parseFloat(grade);
    if (!isNaN(numericGrade)) {
      setStudentGrades(prev => ({
        ...prev,
        [studentId]: numericGrade
      }));
    } else {
      setStudentGrades(prev => {
        const newGrades = { ...prev };
        delete newGrades[studentId];
        return newGrades;
      });
    }
  };

  const getExistingGradeForStudent = (studentId: string) => {
    return existingGrades.filter(grade => grade.student_id === studentId);
  };

  const handleUpdateGrade = async (gradeId: string, studentId: string) => {
    const newValue = studentGrades[studentId];
    if (newValue === undefined) return;

    const formData = form.getValues();
    
    const updateData = {
      value: newValue,
      max_value: formData.maxGrade,
      type: formData.type,
      date: formData.date,
    };

    await onUpdate(gradeId, updateData);
    
    toast({
      title: "Nota atualizada!",
      description: "A nota foi atualizada com sucesso.",
    });
  };

  const handleSubmit = (data: GradeFormValues) => {
    // Verificar se pelo menos um aluno tem nota nova
    const hasNewGrades = Object.values(studentGrades).some(grade => grade > 0);
    
    if (!hasNewGrades) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione pelo menos uma nota para continuar.",
      });
      return;
    }

    // Criar novas notas apenas para alunos que não têm nota existente do mesmo tipo
    const newGradesData = students
      .filter(student => {
        const hasExistingGrade = existingGrades.some(grade => 
          grade.student_id === student.id && grade.type === data.type
        );
        return !hasExistingGrade && studentGrades[student.id] > 0;
      })
      .map(student => ({
        student_id: student.id,
        subject_id: data.subjectId,
        value: studentGrades[student.id],
        max_value: data.maxGrade,
        type: data.type,
        date: data.date,
        teacher_id: profile?.id || '',
        observations: '',
      }));

    if (newGradesData.length === 0) {
      toast({
        variant: "destructive",
        title: "Aviso",
        description: "Não há novas notas para adicionar. Todos os alunos já possuem nota deste tipo.",
      });
      return;
    }

    onSubmit(newGradesData);
    setStudentGrades({});
    form.reset();
    onOpenChange(false);
  };

  const subjectId = form.watch('subjectId');
  const gradeType = form.watch('type');
  const showStudents = subjectId && gradeType && students.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Lançar Notas por Disciplina
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instructorSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} {subject.class_id && `(Turma: ${subject.class_id})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Avaliação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prova">Prova</SelectItem>
                        <SelectItem value="trabalho">Trabalho</SelectItem>
                        <SelectItem value="seminario">Seminário</SelectItem>
                        <SelectItem value="projeto">Projeto</SelectItem>
                        <SelectItem value="participacao">Participação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Máxima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Avaliação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedSubject && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} />
                    <span className="font-medium">
                      {selectedSubject.name}
                    </span>
                    <Badge variant="outline">
                      {students.length} alunos
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingStudents && subjectId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    Carregando alunos da disciplina...
                  </div>
                </CardContent>
              </Card>
            )}

            {showStudents && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    Lista de Alunos ({students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum aluno encontrado nesta disciplina.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Nome do Aluno</TableHead>
                          <TableHead>Notas Existentes</TableHead>
                          <TableHead>Nova Nota</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => {
                          const existingStudentGrades = getExistingGradeForStudent(student.id);
                          const hasExistingGradeOfType = existingStudentGrades.some(g => g.type === gradeType);
                          const existingGradeOfType = existingStudentGrades.find(g => g.type === gradeType);
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.student_id || 'N/A'}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {existingStudentGrades.length === 0 ? (
                                    <Badge variant="outline">Nenhuma nota</Badge>
                                  ) : (
                                    existingStudentGrades.map((grade, index) => (
                                      <Badge 
                                        key={index} 
                                        variant={grade.type === gradeType ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {grade.type}: {grade.value.toFixed(1)}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  placeholder={hasExistingGradeOfType ? `Atual: ${existingGradeOfType?.value.toFixed(1)}` : "0.0"}
                                  value={studentGrades[student.id] || ''}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                {hasExistingGradeOfType && existingGradeOfType && studentGrades[student.id] && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateGrade(existingGradeOfType.id, student.id)}
                                  >
                                    <Edit size={12} className="mr-1" />
                                    Atualizar
                                  </Button>
                                )}
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

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={!showStudents}
              >
                Salvar Novas Notas
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};