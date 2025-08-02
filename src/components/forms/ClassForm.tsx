import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const classFormSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório'),
  period: z.string().min(1, 'Período é obrigatório'),
  coordinator: z.string().min(1, 'Coordenador é obrigatório'),
  year: z.number().min(2020, 'Ano deve ser válido'),
  status: z.string().min(1, 'Status é obrigatório'),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClassFormValues) => void;
  initialData?: Partial<ClassFormValues>;
  mode: 'create' | 'edit';
}

export const ClassForm: React.FC<ClassFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      period: initialData?.period || '',
      coordinator: initialData?.coordinator || '',
      year: initialData?.year || new Date().getFullYear(),
      status: initialData?.status || 'ativo',
    },
  });

  const handleSubmit = (data: ClassFormValues) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Turma' : 'Editar Turma'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Turma</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1º Ano A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordinator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenador</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do coordenador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Letivo</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="2024" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
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
                {mode === 'create' ? 'Criar Turma' : 'Salvar Alterações'}
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