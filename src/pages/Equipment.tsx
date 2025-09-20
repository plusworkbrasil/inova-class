import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEquipment } from '@/hooks/useEquipment';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_date: z.string().optional(),
  location: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  observations: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function Equipment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const { data: equipment, loading, createEquipment, updateEquipment, deleteEquipment } = useEquipment();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      type: '',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_date: '',
      location: '',
      status: 'disponivel',
      observations: '',
    },
  });

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data: EquipmentFormData) => {
    try {
      const equipmentData = {
        name: data.name || '',
        type: data.type || '',
        brand: data.brand || '',
        model: data.model || '',
        serial_number: data.serial_number || '',
        purchase_date: data.purchase_date || '',
        warranty_date: data.warranty_date || '',
        location: data.location || '',
        status: data.status || 'disponivel',
        observations: data.observations || '',
      };

      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, equipmentData);
        setEditingEquipment(null);
      } else {
        await createEquipment(equipmentData);
        setIsCreateDialogOpen(false);
      }
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
    }
  };

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    form.reset({
      name: equipment.name || '',
      type: equipment.type || '',
      brand: equipment.brand || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      purchase_date: equipment.purchase_date || '',
      warranty_date: equipment.warranty_date || '',
      location: equipment.location || '',
      status: equipment.status || 'disponivel',
      observations: equipment.observations || '',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEquipment(id);
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-500';
      case 'em_uso':
        return 'bg-blue-500';
      case 'manutencao':
        return 'bg-yellow-500';
      case 'indisponivel':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'em_uso':
        return 'Em Uso';
      case 'manutencao':
        return 'Manutenção';
      case 'indisponivel':
        return 'Indisponível';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">Gerencie o inventário de equipamentos da escola</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Equipamento</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Equipamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Notebook Dell" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="computador">Computador</SelectItem>
                            <SelectItem value="notebook">Notebook</SelectItem>
                            <SelectItem value="impressora">Impressora</SelectItem>
                            <SelectItem value="projetor">Projetor</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="smartphone">Smartphone</SelectItem>
                            <SelectItem value="camera">Câmera</SelectItem>
                            <SelectItem value="televisao">Televisão</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell, HP, Samsung" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Inspiron 15 3000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série do equipamento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Sala 101, Laboratório" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Garantia</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="disponivel">Disponível</SelectItem>
                            <SelectItem value="em_uso">Em Uso</SelectItem>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                            <SelectItem value="indisponivel">Indisponível</SelectItem>
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
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o equipamento..."
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
                    Cadastrar Equipamento
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={20} />
            Lista de Equipamentos
          </CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>
                      {item.brand && item.model 
                        ? `${item.brand} ${item.model}` 
                        : item.brand || item.model || '-'
                      }
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={editingEquipment?.id === item.id} onOpenChange={(open) => !open && setEditingEquipment(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Equipamento</DialogTitle>
                            </DialogHeader>
                            
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nome do Equipamento *</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ex: Notebook Dell" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tipo *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="computador">Computador</SelectItem>
                                            <SelectItem value="notebook">Notebook</SelectItem>
                                            <SelectItem value="impressora">Impressora</SelectItem>
                                            <SelectItem value="projetor">Projetor</SelectItem>
                                            <SelectItem value="tablet">Tablet</SelectItem>
                                            <SelectItem value="smartphone">Smartphone</SelectItem>
                                            <SelectItem value="camera">Câmera</SelectItem>
                                            <SelectItem value="televisao">Televisão</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="brand"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Marca</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ex: Dell, HP, Samsung" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="model"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Modelo</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ex: Inspiron 15 3000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                      <FormItem className="md:col-span-2">
                                        <FormLabel>Status *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="disponivel">Disponível</SelectItem>
                                            <SelectItem value="em_uso">Em Uso</SelectItem>
                                            <SelectItem value="manutencao">Manutenção</SelectItem>
                                            <SelectItem value="indisponivel">Indisponível</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button type="submit" className="flex-1">
                                    Salvar Alterações
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setEditingEquipment(null)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEquipment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum equipamento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}