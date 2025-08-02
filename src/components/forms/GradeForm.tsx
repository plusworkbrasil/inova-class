import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const gradeFormSchema = z.object({
  studentName: z.string().min(1, 'Nome do aluno é obrigatório'),
  studentId: z.string().min(1, 'Matrícula é obrigatória'),
  class: z.string().min(1, 'Turma é obrigatória'),
  subject: z.string().min(1, 'Disciplina é obrigatória'),
  type: z.string().min(1, 'Tipo de avaliação é obrigatório'),
  grade: z.number().min(0, 'Nota deve ser maior ou igual a 0').max(10, 'Nota não pode exceder 10'),
  maxGrade: z.number().min(1, 'Nota máxima deve ser maior que 0'),
  date: z.string().min(1, 'Data é obrigatória'),
  teacher: z.string().min(1, 'Professor é obrigatório'),
  observations: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GradeFormValues) => void;
  initialData?: Partial<GradeFormValues>;
  mode: 'create' | 'edit';
}

export const GradeForm: React.FC<GradeFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      studentName: initialData?.studentName || '',
      studentId: initialData?.studentId || '',
      class: initialData?.class || '',
      subject: initialData?.subject || '',
      type: initialData?.type || '',
      grade: initialData?.grade || 0,
      maxGrade: initialData?.maxGrade || 10,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      teacher: initialData?.teacher || '',
      observations: initialData?.observations || '',
    },
  });

  const handleSubmit = (data: GradeFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  const mockStudents = [
    { id: '2024001', name: 'João Silva', class: '1º Ano A' },
    { id: '2024002', name: 'Maria Santos', class: '1º Ano A' },
    { id: '2024003', name: 'Pedro Oliveira', class: '2º Ano B' },
    { id: '2024004', name: 'Ana Costa', class: '2º Ano B' },
    { id: '2024005', name: 'Carlos Souza', class: '3º Ano A' },
  ];

  const mockSubjects = [
    'Matemática',
    'Português', 
    'História',
    'Geografia',
    'Ciências',
    'Inglês',
    'Educação Física',
    'Artes'
  ];

  const assessmentTypes = [
    'Prova',
    'Trabalho',
    'Seminário',
    'Projeto',
    'Atividade',
    'Participação',
    'Recuperação'
  ];

  const mockTeachers = [
    'Prof. Carlos Silva',
    'Prof. Ana Costa',
    'Prof. Maria Oliveira',
    'Prof. João Santos',
    'Prof. Lucia Ferreira'
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
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        const student = mockStudents.find(s => s.name === value);
                        if (student) {
                          field.onChange(value);
                          form.setValue('studentId', student.id);
                          form.setValue('class', student.class);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockStudents.map((student) => (
                          <SelectItem key={student.id} value={student.name}>
                            {student.name} - {student.id}
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
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Matrícula do aluno" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <FormControl>
                      <Input placeholder="Turma" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
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
                        {mockSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

              <FormField
                control={form.control}
                name="teacher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockTeachers.map((teacher) => (
                          <SelectItem key={teacher} value={teacher}>
                            {teacher}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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