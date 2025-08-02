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
import { Card, CardContent } from '@/components/ui/card';

const declarationFormSchema = z.object({
  studentName: z.string().min(1, 'Nome do aluno é obrigatório'),
  studentId: z.string().min(1, 'Matrícula é obrigatória'),
  type: z.string().min(1, 'Tipo de declaração é obrigatório'),
  requestedBy: z.string().min(1, 'Solicitante é obrigatório'),
  purpose: z.string().min(1, 'Finalidade é obrigatória'),
  observations: z.string().optional(),
  urgency: z.string().min(1, 'Urgência é obrigatória'),
});

type DeclarationFormValues = z.infer<typeof declarationFormSchema>;

interface DeclarationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DeclarationFormValues) => void;
  initialData?: Partial<DeclarationFormValues>;
  mode: 'create' | 'edit';
}

export const DeclarationForm: React.FC<DeclarationFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}) => {
  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationFormSchema),
    defaultValues: {
      studentName: initialData?.studentName || '',
      studentId: initialData?.studentId || '',
      type: initialData?.type || '',
      requestedBy: initialData?.requestedBy || '',
      purpose: initialData?.purpose || '',
      observations: initialData?.observations || '',
      urgency: initialData?.urgency || 'normal',
    },
  });

  const handleSubmit = (data: DeclarationFormValues) => {
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

  const declarationTypes = [
    {
      value: 'Declaração de Matrícula',
      label: 'Declaração de Matrícula',
      description: 'Comprova que o aluno está matriculado na instituição'
    },
    {
      value: 'Declaração de Frequência',
      label: 'Declaração de Frequência',
      description: 'Atesta a frequência do aluno nas aulas'
    },
    {
      value: 'Histórico Escolar',
      label: 'Histórico Escolar',
      description: 'Documento com histórico completo de notas e disciplinas'
    },
    {
      value: 'Declaração de Conclusão',
      label: 'Declaração de Conclusão',
      description: 'Comprova a conclusão do curso pelo aluno'
    },
    {
      value: 'Declaração de Escolaridade',
      label: 'Declaração de Escolaridade',
      description: 'Atesta o nível de escolaridade do aluno'
    },
    {
      value: 'Boletim Escolar',
      label: 'Boletim Escolar',
      description: 'Relatório das notas do período letivo'
    }
  ];

  const urgencyLevels = [
    { value: 'baixa', label: 'Baixa (até 10 dias)', color: 'text-green-600' },
    { value: 'normal', label: 'Normal (até 5 dias)', color: 'text-blue-600' },
    { value: 'alta', label: 'Alta (até 2 dias)', color: 'text-orange-600' },
    { value: 'urgente', label: 'Urgente (24 horas)', color: 'text-red-600' },
  ];

  const selectedType = form.watch('type');
  const selectedDeclaration = declarationTypes.find(d => d.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Solicitação de Declaração' : 'Editar Solicitação'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dados do Aluno */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Dados do Aluno</h3>
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
                                {student.name} - {student.class}
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
              </CardContent>
            </Card>

            {/* Tipo de Declaração */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Tipo de Declaração</h3>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione o tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o tipo de declaração" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {declarationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {selectedDeclaration && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            <strong>{selectedDeclaration.label}:</strong> {selectedDeclaration.description}
                          </p>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Dados da Solicitação */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Dados da Solicitação</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requestedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solicitante</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Quem está solicitando?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Aluno">Aluno</SelectItem>
                              <SelectItem value="Responsável">Responsável</SelectItem>
                              <SelectItem value="Escola">Escola</SelectItem>
                              <SelectItem value="Terceiro">Terceiro (procuração)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Nível de urgência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {urgencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  <span className={level.color}>{level.label}</span>
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
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finalidade</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Para que será utilizada a declaração? (ex: matrícula em curso, trabalho, bolsa de estudos)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais importantes para a emissão da declaração..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {mode === 'create' ? 'Solicitar Declaração' : 'Salvar Alterações'}
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