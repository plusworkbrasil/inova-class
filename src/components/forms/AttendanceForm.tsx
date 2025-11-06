import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Users, Check, X, CheckCheck, XCircle, RotateCcw, FileText, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrasilia, toBrasiliaDate } from '@/lib/utils';
import { useInstructorClasses } from '@/hooks/useInstructorClasses';
import { useInstructorSubjects } from '@/hooks/useInstructorSubjects';

const attendanceFormSchema = z.object({
  classId: z.string().min(1, 'Turma é obrigatória'),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  dailyActivity: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [studentAttendance, setStudentAttendance] = useState<Record<string, boolean>>({});
  const [students, setStudents] = useState<Array<{id: string, name: string, student_id: string, enrollment_number?: string}>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const { profile, user } = useAuth();
  
  // Flag para verificar se é instrutor
  const isInstructor = profile?.role === 'instructor';
  
  // Usar hooks apropriados baseado no role
  const { data: allClasses, loading: loadingAllClasses } = useSupabaseClasses();
  const { classes: instructorClasses, loading: loadingInstructorClasses } = useInstructorClasses();
  const { data: subjectsAll, loading: loadingSubjectsAll } = useSupabaseSubjects();
  const { subjects: instructorSubjects, loading: loadingInstructorSubjects } = useInstructorSubjects();
  
  // Selecionar dados baseado no role do usuário (com fallback para evitar listas vazias)
  const classes = isInstructor
    ? (instructorClasses && instructorClasses.length > 0 ? instructorClasses : allClasses)
    : allClasses;
  const loadingClasses = isInstructor
    ? (loadingInstructorClasses || (instructorClasses.length === 0 && loadingAllClasses))
    : loadingAllClasses;
  
  // Normalizar subjects para um formato comum, usando fonte com fallback
  type MinimalSubject = { id: string; name: string; class_id: string; teacher_id?: string };
  const sourceSubjects: any[] = isInstructor
    ? ((instructorSubjects && instructorSubjects.length > 0) ? instructorSubjects : (subjectsAll || []))
    : (subjectsAll || []);
  const normalizedSubjects: MinimalSubject[] = sourceSubjects.map((s: any) => ({
    id: s.id,
    name: s.name,
    class_id: s.class_id,
    teacher_id: s.teacher_id
  }));
  
  const loadingSubjects = isInstructor
    ? (loadingInstructorSubjects || (instructorSubjects.length === 0 && loadingSubjectsAll))
    : loadingSubjectsAll;

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      date: getTodayInBrasilia(),
    },
  });

  // Filtrar disciplinas pela turma selecionada usando dados normalizados
  const selectedClassId = form.watch('classId');
  const classSubjects = normalizedSubjects.filter(
    (subject) => subject.class_id === selectedClassId
  );

  // Buscar alunos da turma selecionada
  const fetchStudentsFromClass = async (classId: string) => {
    if (!classId) return;
    
    setLoadingStudents(true);
    setLoadingError(null);
    try {
      console.log('🔍 Buscando alunos da turma:', classId, 'Usuário:', user?.id, 'Role:', profile?.role);
      
      // Para instrutores, usar função RPC segura
      const { data, error } = isInstructor 
        ? await supabase.rpc('get_instructor_class_students', {
            instructor_id: user?.id,
            target_class_id: classId
          })
        : await supabase
            .from('profiles')
            .select('id, name, student_id, enrollment_number')
            .eq('class_id', classId)
            .eq('status', 'active')
            .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar alunos:', error);
        setLoadingError(`Erro ao carregar alunos: ${error.message}`);
        throw error;
      }
      
      console.log('✅ Alunos encontrados:', data?.length || 0);
      
      if (!data || data.length === 0) {
        if (isInstructor) {
          setLoadingError('Nenhum aluno encontrado. Verifique se você tem disciplinas atribuídas nesta turma.');
        } else {
          setLoadingError('Nenhum aluno encontrado nesta turma.');
        }
      }
      
      setStudents(data || []);
    } catch (error: any) {
      console.error('❌ Erro crítico ao buscar alunos:', error);
      setStudents([]);
      if (!loadingError) {
        setLoadingError(error.message || 'Erro desconhecido ao carregar alunos');
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    const classId = form.watch('classId');
    if (classId) {
      fetchStudentsFromClass(classId);
      // Reset subject selection when class changes
      form.setValue('subjectId', '');
    } else {
      setStudents([]);
    }
  }, [form.watch('classId')]);

  const toggleStudentAttendance = (studentId: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAllAsPresent = () => {
    const allPresent: Record<string, boolean> = {};
    students.forEach(student => {
      allPresent[student.id] = true;
    });
    setStudentAttendance(allPresent);
  };

  const markAllAsAbsent = () => {
    const allAbsent: Record<string, boolean> = {};
    students.forEach(student => {
      allAbsent[student.id] = false;
    });
    setStudentAttendance(allAbsent);
  };

  const clearAllAttendance = () => {
    setStudentAttendance({});
  };

  const handleSubmit = (data: AttendanceFormValues) => {
    const attendanceData = {
      ...data,
      date: toBrasiliaDate(data.date),
      dailyActivity: data.dailyActivity,
      attendance: students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        isPresent: studentAttendance[student.id] || false,
      }))
    };
    
    onSubmit(attendanceData);
    onOpenChange(false);
    form.reset({
      classId: '',
      subjectId: '',
      date: getTodayInBrasilia(),
      dailyActivity: '',
    });
    setStudentAttendance({});
    setStudents([]);
  };

  const selectedClass = form.watch('classId');
  const showStudents = selectedClass && form.watch('subjectId') && form.watch('date') && students.length > 0;

  const presentCount = Object.values(studentAttendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Registrar Chamada
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Mensagem quando instrutor não tem disciplinas atribuídas */}
            {isInstructor && !loadingClasses && classes.length === 0 && (
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Você ainda não foi atribuído a nenhuma turma/disciplina. Peça a um administrador para associá-lo em Disciplinas.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingClasses ? (
                          <SelectItem value="__loading__" disabled>Carregando turmas...</SelectItem>
                        ) : classes.length === 0 ? (
                          <SelectItem value="__none__" disabled>Nenhuma turma disponível</SelectItem>
                        ) : (
                          classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.year}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedClassId || classSubjects.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedClassId 
                              ? "Selecione uma turma primeiro" 
                              : classSubjects.length === 0 
                                ? "Nenhuma disciplina disponível"
                                : "Selecione a disciplina"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingSubjects ? (
                          <SelectItem value="__loading__" disabled>Carregando disciplinas...</SelectItem>
                        ) : !selectedClassId ? (
                          <SelectItem value="__select_class__" disabled>Selecione uma turma primeiro</SelectItem>
                        ) : classSubjects.length === 0 ? (
                          <SelectItem value="__none__" disabled>Nenhuma disciplina disponível</SelectItem>
                        ) : (
                          classSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mostrar erro se houver */}
            {loadingError && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  {loadingError}
                </p>
                {isInstructor && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Contate o administrador para atribuir disciplinas para você nesta turma.
                  </p>
                )}
              </div>
            )}

            {loadingStudents && selectedClass && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="text-center space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <p className="text-sm text-muted-foreground">
                      Carregando alunos da turma...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {showStudents && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={20} />
                        <h3 className="text-lg font-medium">Lista de Chamada ({students.length} alunos)</h3>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Presentes: {presentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          Ausentes: {absentCount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={markAllAsPresent}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCheck size={16} className="mr-1" />
                        Marcar Todos Presentes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={markAllAsAbsent}
                      >
                        <XCircle size={16} className="mr-1" />
                        Marcar Todos Ausentes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={clearAllAttendance}
                      >
                        <RotateCcw size={16} className="mr-1" />
                        Limpar Marcações
                      </Button>
                    </div>
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum aluno encontrado nesta turma.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {students.map((student) => {
                      const isPresent = studentAttendance[student.id];
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
                            isPresent === true
                              ? 'border-green-500 bg-green-50'
                              : isPresent === false
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleStudentAttendance(student.id)}
                        >
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Matrícula: {student.enrollment_number || student.student_id || 'N/A'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPresent === true && (
                              <Badge variant="default" className="bg-green-500">
                                <Check size={12} className="mr-1" />
                                Presente
                              </Badge>
                            )}
                            {isPresent === false && (
                              <Badge variant="destructive">
                                <X size={12} className="mr-1" />
                                Falta
                              </Badge>
                            )}
                            {isPresent === undefined && (
                              <Badge variant="outline">Não marcado</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={!showStudents || Object.keys(studentAttendance).length === 0}
              >
                Salvar Chamada
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