import React, { useState } from 'react';
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
  const { data: classes, loading: loadingClasses } = useSupabaseClasses();
  const { data: subjects, loading: loadingSubjects } = useSupabaseSubjects();
  
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const mockStudents = [
    { id: '1', name: 'João Silva', studentId: '2024001' },
    { id: '2', name: 'Maria Santos', studentId: '2024002' },
    { id: '3', name: 'Pedro Oliveira', studentId: '2024003' },
    { id: '4', name: 'Ana Costa', studentId: '2024004' },
    { id: '5', name: 'Carlos Souza', studentId: '2024005' },
    { id: '6', name: 'Luciana Ferreira', studentId: '2024006' },
  ];

  const toggleStudentAttendance = (studentId: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSubmit = (data: AttendanceFormValues) => {
    const attendanceData = {
      ...data,
      attendance: mockStudents.map(student => ({
        studentId: student.id,
        studentName: student.name,
        isPresent: studentAttendance[student.id] || false,
      }))
    };
    
    onSubmit(attendanceData);
    onOpenChange(false);
    form.reset();
    setStudentAttendance({});
  };

  const selectedClass = form.watch('classId');
  const showStudents = selectedClass && form.watch('subjectId') && form.watch('date');

  const presentCount = Object.values(studentAttendance).filter(Boolean).length;
  const absentCount = mockStudents.length - presentCount;

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
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

            {showStudents && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={20} />
                      <h3 className="text-lg font-medium">Lista de Chamada</h3>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockStudents.map((student) => {
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
                              Matrícula: {student.studentId}
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