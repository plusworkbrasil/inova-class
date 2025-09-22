import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useRealRecipients } from '@/hooks/useRealRecipients';

const evasionFormSchema = z.object({
  studentName: z.string().min(1, 'Aluno é obrigatório'),
  studentId: z.string().min(1, 'Matrícula é obrigatória'),
  class: z.string().min(1, 'Turma é obrigatória'),
  evasionReason: z.string().min(1, 'Motivo da evasão é obrigatório'),
  evasionDate: z.string().min(1, 'Data da evasão é obrigatória'),
  observations: z.string().optional(),
});

type EvasionFormValues = z.infer<typeof evasionFormSchema>;

interface EvasionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EvasionFormValues) => void;
  initialData?: Partial<EvasionFormValues>;
  mode: 'create' | 'edit';
}

export const EvasionForm: React.FC<EvasionFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const { students: realStudents, classes: realClasses } = useRealRecipients();
  
  const form = useForm<EvasionFormValues>({
    resolver: zodResolver(evasionFormSchema),
    defaultValues: {
      studentName: initialData?.studentName || '',
      studentId: initialData?.studentId || '',
      class: initialData?.class || '',
      evasionReason: initialData?.evasionReason || '',
      evasionDate: initialData?.evasionDate || new Date().toISOString().split('T')[0],
      observations: initialData?.observations || '',
    },
  });

  const handleSubmit = (data: EvasionFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  // Get class name helper
  const getClassName = (classId: string) => {
    const classData = realClasses.find(c => c.id === classId);
    return classData ? classData.name : 'Sem turma';
  };

  const evasionReasons = [
    'Dificuldades financeiras',
    'Mudança de cidade',
    'Problemas de saúde',
    'Insatisfação com o curso',
    'Problemas familiares',
    'Conseguiu emprego',
    'Dificuldades acadêmicas',
    'Falta de tempo',
    'Outros motivos pessoais'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Registrar Evasão' : 'Editar Registro de Evasão'}
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
                        const student = realStudents.find(s => s.id === value);
                        if (student) {
                          field.onChange(student.name);
                          form.setValue('studentId', student.id);
                          form.setValue('class', getClassName(student.class_id));
                        }
                      }} 
                      defaultValue={realStudents.find(s => s.name === field.value)?.id || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {realStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - {getClassName(student.class_id)}
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
                      <Select disabled value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Matrícula do aluno" />
                        </SelectTrigger>
                      </Select>
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
                      <Select disabled value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Turma do aluno" />
                        </SelectTrigger>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evasionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Evasão</FormLabel>
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

            <FormField
              control={form.control}
              name="evasionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Evasão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {evasionReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
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
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre a evasão..."
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
                {mode === 'create' ? 'Registrar Evasão' : 'Salvar Alterações'}
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