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
import { Calendar, Users, Check, X } from 'lucide-react';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const attendanceFormSchema = z.object({
  classId: z.string().min(1, 'Turma é obrigatória'),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
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
  const [students, setStudents] = useState<Array<{id: string, name: string, student_id: string}>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { data: classes, loading: loadingClasses } = useSupabaseClasses();
  const { data: subjects, loading: loadingSubjects } = useSupabaseSubjects();
  const { profile } = useAuth();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Filtrar disciplinas pela turma selecionada
  const selectedClassId = form.watch('classId');
  const classSubjects = subjects?.filter(subject => {
    // Para admin/secretary: mostrar todas as disciplinas da turma
    if (profile?.role === 'admin' || profile?.role === 'secretary') {
      return subject.class_id === selectedClassId;
    }
    // Para instructors: apenas disciplinas que eles ministram na turma selecionada
    return subject.class_id === selectedClassId && (
      subject.teacher_id === profile?.id || 
      profile?.instructor_subjects?.includes(subject.name)
    );
  }) || [];

  // Buscar alunos da turma selecionada
  const fetchStudentsFromClass = async (classId: string) => {
    if (!classId) return;
    
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_id')
        .eq('class_id', classId)
        .eq('role', 'student');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setStudents([]);
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

  const handleSubmit = (data: AttendanceFormValues) => {
    const attendanceData = {
      ...data,
      attendance: students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        isPresent: studentAttendance[student.id] || false,
      }))
    };
    
    onSubmit(attendanceData);
    onOpenChange(false);
    form.reset();
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
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} - {classItem.year}
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
                        {classSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
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

            {loadingStudents && selectedClass && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    Carregando alunos da turma...
                  </div>
                </CardContent>
              </Card>
            )}

            {showStudents && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
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
                              Matrícula: {student.student_id || 'N/A'}
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