import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Monitor, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const equipmentSchema = z.object({
  student_id: z.string().min(1, { message: 'Selecione um aluno' }),
  computer_number: z.string().regex(/^[0-9]{3}$/, { message: 'Número deve ter 3 dígitos' }),
  shift: z.enum(['morning', 'afternoon', 'evening'], { message: 'Selecione um turno' }),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

const Equipment = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const userRole: UserRole = (user?.role || 'instructor') as UserRole;
  const userName = user?.name || 'Professor Instrutor';

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      notes: '',
    },
  });

  // Buscar alunos
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const data = await apiClient.get('profiles');
        return data.filter((profile: any) => profile.role === 'student');
      } catch (error) {
        console.error('Error fetching students:', error);
        return [];
      }
    },
  });

  // Buscar atribuições de computador - usando mock data por enquanto
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['computer-assignments'],
    queryFn: async () => {
      // Por enquanto retornamos dados mock até a tabela estar implementada
      return [];
    },
  });

  // Criar/Atualizar atribuição - usando mock por enquanto
  const assignmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormData & { id?: string }) => {
      // Por enquanto simula sucesso - implementação real quando a tabela estiver pronta
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computer-assignments'] });
      setIsDialogOpen(false);
      setEditingAssignment(null);
      form.reset();
      toast({
        title: "Sucesso!",
        description: editingAssignment ? "Atribuição atualizada com sucesso." : "Computador atribuído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao processar atribuição.",
      });
    },
  });

  // Remover atribuição - usando mock por enquanto
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Por enquanto simula sucesso - implementação real quando a tabela estiver pronta
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computer-assignments'] });
      toast({
        title: "Sucesso!",
        description: "Atribuição removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao remover atribuição.",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    assignmentMutation.mutate({
      ...data,
      id: editingAssignment?.id,
    });
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    form.setValue('student_id', assignment.student_id);
    form.setValue('computer_number', assignment.computer_number);
    form.setValue('shift', assignment.shift);
    form.setValue('notes', assignment.notes || '');
    setIsDialogOpen(true);
  };

  const handleRemove = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta atribuição?')) {
      removeMutation.mutate(id);
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      evening: 'Noite'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const resetForm = () => {
    form.reset();
    setEditingAssignment(null);
  };

  return (
    <Layout userRole={userRole} userName={userName}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipamentos</h1>
            <p className="text-muted-foreground">Gerencie a atribuição de computadores aos alunos</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Atribuir Computador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? 'Editar Atribuição' : 'Atribuir Computador'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssignment 
                    ? 'Edite os dados da atribuição do computador.'
                    : 'Atribua um computador a um aluno para o laboratório.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Aluno</Label>
                  <Select
                    value={form.watch('student_id')}
                    onValueChange={(value) => form.setValue('student_id', value)}
                    disabled={!!editingAssignment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.student_id || student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.student_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.student_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="computer_number">Número do Computador</Label>
                  <Input
                    id="computer_number"
                    placeholder="Ex: 001"
                    maxLength={3}
                    {...form.register('computer_number')}
                  />
                  {form.formState.errors.computer_number && (
                    <p className="text-sm text-destructive">{form.formState.errors.computer_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">Turno</Label>
                  <Select
                    value={form.watch('shift')}
                    onValueChange={(value) => form.setValue('shift', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="evening">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.shift && (
                    <p className="text-sm text-destructive">{form.formState.errors.shift.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações sobre a atribuição..."
                    {...form.register('notes')}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={assignmentMutation.isPending}
                  >
                    {assignmentMutation.isPending ? 'Salvando...' : (editingAssignment ? 'Atualizar' : 'Atribuir')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Atribuições de Computadores
            </CardTitle>
            <CardDescription>
              Lista de computadores atribuídos aos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma atribuição encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Computador</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Atribuído por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment: any) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.student?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.student?.student_id || assignment.student?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          PC {assignment.computer_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getShiftLabel(assignment.shift)}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.assigned_by_name}</TableCell>
                      <TableCell>
                        {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Equipment;