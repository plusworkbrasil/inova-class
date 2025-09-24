import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEquipment } from '@/hooks/useEquipment';
import { Plus, Search, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { EquipmentAllocationDialog } from '@/components/ui/equipment-allocation-dialog';
import { EquipmentAllocationsView } from '@/components/ui/equipment-allocations-view';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';

const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  patrimonio: z.string().min(1, "Patrimônio é obrigatório"),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_date: z.string().optional(),
  location: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  observations: z.string().optional(),
  responsible_id: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

const Equipment = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedEquipmentForAllocation, setSelectedEquipmentForAllocation] = useState<any | null>(null);
  
  const { data, loading, createEquipment, updateEquipment, deleteEquipment } = useEquipment();

  const userRole = profile?.role || 'admin';
  const userName = profile?.name || 'Usuário';

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      type: '',
      patrimonio: '',
      description: '',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_date: '',
      location: '',
      status: 'disponivel',
      observations: '',
      responsible_id: '',
    },
  });

  const filteredEquipment = data.filter(equipment =>
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (formData: EquipmentFormData) => {
    try {
      // Convert empty string to null for responsible_id
      const cleanedData = {
        ...formData,
        responsible_id: formData.responsible_id === "" ? null : formData.responsible_id
      };

      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, cleanedData);
        setEditingEquipment(null);
      } else {
        await createEquipment(cleanedData as any);
        setIsCreateDialogOpen(false);
      }
      form.reset();
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    form.reset({
      name: equipment.name,
      type: equipment.type,
      patrimonio: equipment.patrimonio || '',
      description: equipment.description || '',
      brand: equipment.brand || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      purchase_date: equipment.purchase_date || '',
      warranty_date: equipment.warranty_date || '',
      location: equipment.location || '',
      status: equipment.status,
      observations: equipment.observations || '',
      responsible_id: equipment.responsible_id || '',
    });
  };

  const handleAllocate = (equipment: any) => {
    setSelectedEquipmentForAllocation(equipment);
    setAllocationDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEquipment(id);
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'default';
      case 'em_uso':
        return 'secondary';
      case 'manutencao':
        return 'destructive';
      case 'indisponivel':
        return 'outline';
      default:
        return 'default';
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
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Equipamentos</h1>
            <p className="text-muted-foreground">Gerencie os equipamentos e suas alocações</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Equipamentos</CardTitle>
                <CardDescription>
                  Cadastre e gerencie equipamentos do sistema
                </CardDescription>
              </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Equipamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Nome do equipamento"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patrimonio">Patrimônio</Label>
                      <Input
                        id="patrimonio"
                        {...form.register('patrimonio')}
                        placeholder="Número do patrimônio"
                      />
                      {form.formState.errors.patrimonio && (
                        <p className="text-sm text-red-500">{form.formState.errors.patrimonio.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select onValueChange={(value) => form.setValue('type', value)} defaultValue={form.watch('type')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="computador">Computador</SelectItem>
                          <SelectItem value="notebook">Notebook</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="projetor">Projetor</SelectItem>
                          <SelectItem value="impressora">Impressora</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.type && (
                        <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        {...form.register('description')}
                        placeholder="Descrição detalhada do equipamento"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        {...form.register('brand')}
                        placeholder="Marca do equipamento"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        {...form.register('model')}
                        placeholder="Modelo do equipamento"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Número de Série</Label>
                      <Input
                        id="serial_number"
                        {...form.register('serial_number')}
                        placeholder="Número de série"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <Input
                        id="location"
                        {...form.register('location')}
                        placeholder="Local onde está o equipamento"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">Data de Compra</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        {...form.register('purchase_date')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warranty_date">Data de Garantia</Label>
                      <Input
                        id="warranty_date"
                        type="date"
                        {...form.register('warranty_date')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => form.setValue('status', value)} defaultValue={form.watch('status')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="em_uso">Em Uso</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="indisponivel">Indisponível</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      {...form.register('observations')}
                      placeholder="Observações adicionais"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Cadastrar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="equipments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
              <TabsTrigger value="allocations">Alocações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="equipments" className="mt-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar equipamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.length > 0 ? (
                    filteredEquipment.map((equipment) => (
                      <TableRow key={equipment.id}>
                        <TableCell className="font-medium">{equipment.name}</TableCell>
                        <TableCell>
                          {equipment.patrimonio && (
                            <Badge variant="outline">{equipment.patrimonio}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{equipment.type}</TableCell>
                        <TableCell>
                          {equipment.brand && equipment.model 
                            ? `${equipment.brand} ${equipment.model}`
                            : equipment.brand || equipment.model || '-'
                          }
                        </TableCell>
                        <TableCell>{equipment.location || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(equipment.status)}
                            className="capitalize"
                          >
                            {getStatusLabel(equipment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAllocate(equipment)}
                              title="Alocar para aluno"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(equipment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(equipment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">Nenhum equipamento encontrado.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="allocations" className="mt-6">
              <EquipmentAllocationsView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && setEditingEquipment(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  {...form.register('name')}
                  placeholder="Nome do equipamento"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-patrimonio">Patrimônio</Label>
                <Input
                  id="edit-patrimonio"
                  {...form.register('patrimonio')}
                  placeholder="Número do patrimônio"
                />
                {form.formState.errors.patrimonio && (
                  <p className="text-sm text-red-500">{form.formState.errors.patrimonio.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select onValueChange={(value) => form.setValue('type', value)} value={form.watch('type')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computador">Computador</SelectItem>
                    <SelectItem value="notebook">Notebook</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="projetor">Projetor</SelectItem>
                    <SelectItem value="impressora">Impressora</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  {...form.register('description')}
                  placeholder="Descrição detalhada do equipamento"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Marca</Label>
                <Input
                  id="edit-brand"
                  {...form.register('brand')}
                  placeholder="Marca do equipamento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  {...form.register('model')}
                  placeholder="Modelo do equipamento"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-serial">Número de Série</Label>
                <Input
                  id="edit-serial"
                  {...form.register('serial_number')}
                  placeholder="Número de série"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Localização</Label>
                <Input
                  id="edit-location"
                  {...form.register('location')}
                  placeholder="Local onde está o equipamento"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase">Data de Compra</Label>
                <Input
                  id="edit-purchase"
                  type="date"
                  {...form.register('purchase_date')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-warranty">Data de Garantia</Label>
                <Input
                  id="edit-warranty"
                  type="date"
                  {...form.register('warranty_date')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value)} value={form.watch('status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                {...form.register('observations')}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEquipment(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EquipmentAllocationDialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
        selectedEquipment={selectedEquipmentForAllocation}
      />
      </div>
    </Layout>
  );
};

export default Equipment;