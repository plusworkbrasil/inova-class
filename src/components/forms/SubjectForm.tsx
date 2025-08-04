import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const subjectFormSchema = z.object({
  name: z.string().min(1, 'Nome da disciplina é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  teacher: z.string().min(1, 'Instrutor é obrigatório'),
  workload: z.number().min(1, 'Carga horária deve ser maior que 0'),
  description: z.string().optional(),
  classes: z.array(z.string()).min(1, 'Selecione pelo menos uma turma'),
  status: z.string().min(1, 'Status é obrigatório'),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubjectFormValues) => void;
  initialData?: Partial<SubjectFormValues>;
  mode: 'create' | 'edit';
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const availableTeachers = [
    'Prof. João Silva',
    'Prof. Maria Santos',
    'Prof. Ana Costa',
    'Prof. Pedro Oliveira',
    'Prof. Carlos Souza',
    'Prof. Luciana Ferreira',
  ];

  const availableClasses = [
    '1º Ano A',
    '1º Ano B', 
    '1º Ano C',
    '2º Ano A',
    '2º Ano B',
    '3º Ano A',
  ];

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      teacher: initialData?.teacher || '',
      workload: initialData?.workload || 40,
      description: initialData?.description || '',
      classes: initialData?.classes || [],
      status: initialData?.status || 'ativo',
    },
  });

  const handleSubmit = (data: SubjectFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  const handleClassToggle = (className: string, checked: boolean) => {
    const currentClasses = form.getValues('classes') || [];
    if (checked) {
      form.setValue('classes', [...currentClasses, className]);
    } else {
      form.setValue('classes', currentClasses.filter(c => c !== className));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Disciplina' : 'Editar Disciplina'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MAT001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="teacher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrutor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o instrutor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTeachers.map((teacher) => (
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

              <FormField
                control={form.control}
                name="workload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária (horas)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="40" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição da disciplina, objetivos, etc."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classes"
              render={() => (
                <FormItem>
                  <FormLabel>Turmas</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-md">
                    {availableClasses.map((className) => (
                      <div key={className} className="flex items-center space-x-2">
                        <Checkbox
                          id={className}
                          checked={form.getValues('classes')?.includes(className) || false}
                          onCheckedChange={(checked) => handleClassToggle(className, !!checked)}
                        />
                        <Label 
                          htmlFor={className}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {className}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {mode === 'create' ? 'Criar Disciplina' : 'Salvar Alterações'}
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