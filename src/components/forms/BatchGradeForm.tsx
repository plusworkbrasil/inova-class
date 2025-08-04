import React, { useState } from 'react';
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

const batchGradeFormSchema = z.object({
  class: z.string().min(1, 'Turma é obrigatória'),
  subject: z.string().min(1, 'Disciplina é obrigatória'),
  type: z.string().min(1, 'Tipo de avaliação é obrigatório'),
  maxGrade: z.number().min(1, 'Nota máxima deve ser maior que 0'),
  date: z.string().min(1, 'Data é obrigatória'),
  teacher: z.string().min(1, 'Instrutor é obrigatório'),
  students: z.array(z.object({
    studentId: z.string(),
    studentName: z.string(),
    grade: z.number().min(0, 'Nota deve ser maior ou igual a 0').max(10, 'Nota não pode exceder 10'),
  })).min(1, 'Pelo menos um aluno deve ter nota'),
});

type BatchGradeFormValues = z.infer<typeof batchGradeFormSchema>;

interface BatchGradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any[]) => void;
  selectedClass: string;
  selectedSubject: string;
  currentUser?: any;
  students: Array<{ id: string; name: string }>;
}

export const BatchGradeForm: React.FC<BatchGradeFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  selectedClass,
  selectedSubject,
  currentUser,
  students
}) => {
  const [studentGrades, setStudentGrades] = useState<{ [key: string]: number }>({});

  const form = useForm<BatchGradeFormValues>({
    resolver: zodResolver(batchGradeFormSchema),
    defaultValues: {
      class: selectedClass,
      subject: selectedSubject,
      type: '',
      maxGrade: 10,
      date: new Date().toISOString().split('T')[0],
      teacher: currentUser?.name || '',
      students: [],
    },
  });

  const handleGradeChange = (studentId: string, grade: string) => {
    const numericGrade = parseFloat(grade);
    if (!isNaN(numericGrade)) {
      setStudentGrades(prev => ({
        ...prev,
        [studentId]: numericGrade
      }));
    }
  };

  const handleSubmit = (data: BatchGradeFormValues) => {
    // Verificar se pelo menos um aluno tem nota
    const hasGrades = Object.values(studentGrades).some(grade => grade > 0);
    
    if (!hasGrades) {
      form.setError('students', { 
        type: 'manual', 
        message: 'Informe pelo menos uma nota para salvar' 
      });
      return;
    }

    // Converter para o formato esperado pelo onSubmit
    const gradesData = students.map(student => ({
      studentName: student.name,
      studentId: student.id,
      class: data.class,
      subject: data.subject,
      type: data.type,
      grade: studentGrades[student.id] || 0,
      maxGrade: data.maxGrade,
      date: data.date,
      teacher: data.teacher,
    })).filter(grade => grade.grade > 0); // Só incluir alunos com nota > 0

    onSubmit(gradesData);
    setStudentGrades({});
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançamento de Notas em Lote</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
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
                    <FormControl>
                      <Input {...field} disabled />
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
                    <FormLabel>Instrutor</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
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

            <Card>
              <CardHeader>
                <CardTitle>Notas dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="students"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead>Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            placeholder="0.0"
                            value={studentGrades[student.id] || ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Todas as Notas
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};