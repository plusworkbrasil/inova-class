import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useUsers } from '@/hooks/useUsers';

const gradeFormSchema = z.object({
  student_id: z.string().min(1, 'Aluno é obrigatório'),
  subject_id: z.string().min(1, 'Disciplina é obrigatória'),
  type: z.string().min(1, 'Tipo de avaliação é obrigatório'),
  grade: z.number().min(0, 'Nota deve ser maior ou igual a 0').max(10, 'Nota não pode exceder 10'),
  maxGrade: z.number().min(1, 'Nota máxima deve ser maior que 0'),
  date: z.string().min(1, 'Data é obrigatória'),
  observations: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GradeFormValues) => void;
  initialData?: Partial<GradeFormValues>;
  mode: 'create' | 'edit';
  userRole?: string;
  currentUser?: any;
}

export const GradeForm: React.FC<GradeFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  userRole,
  currentUser
}) => {
  const { data: classes } = useSupabaseClasses();
  const { data: subjects } = useSupabaseSubjects();
  const { users } = useUsers();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      student_id: initialData?.student_id || '',
      subject_id: initialData?.subject_id || '',
      type: initialData?.type || '',
      grade: (initialData as any)?.value || (initialData as any)?.grade || 0,
      maxGrade: (initialData as any)?.max_value || (initialData as any)?.maxGrade || 10,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      observations: initialData?.observations || '',
    },
  });

  const handleSubmit = (data: GradeFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  // Filtrar apenas estudantes
  const students = users.filter(user => user.role === 'student');

  // Filtrar professores/instrutores
  const teachers = users.filter(user => user.role === 'instructor');

  // Encontrar a turma do estudante selecionado
  const getStudentClass = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student?.class_id) return null;
    return classes.find(c => c.id === student.class_id);
  };

  const assessmentTypes = [
    'Prova',
    'Trabalho',
    'Seminário',
    'Projeto',
    'Atividade',
    'Participação'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Lançar Nova Nota' : 'Editar Nota'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const student = students.find(s => s.id === value);
                        setSelectedStudent(student);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - {student.student_id || 'S/N'}
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
                name="subject_id"
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
            </div>

            {selectedStudent && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <strong>Matrícula:</strong> {selectedStudent.student_id || 'Não informada'} | 
                  <strong> Turma:</strong> {getStudentClass(selectedStudent.id)?.name || 'Não informada'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Avaliação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Obtida</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.0" 
                        step="0.1"
                        min="0"
                        max="10"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Máxima</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10.0" 
                        step="0.1"
                        min="1"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="bg-muted p-3 rounded-md flex items-center">
                <div className="text-sm">
                  <strong>Professor Responsável:</strong> {currentUser?.name || 'Não informado'}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre a avaliação..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {mode === 'create' ? 'Lançar Nota' : 'Salvar Alterações'}
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