import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, UserX, TrendingDown, AlertTriangle, BarChart, Undo2 } from 'lucide-react';
import { EvasionForm } from '@/components/forms/EvasionForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseEvasions } from '@/hooks/useSupabaseEvasions';
import { useRealRecipients } from '@/hooks/useRealRecipients';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Evasions = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'secretary') as UserRole;
  const userName = profile?.name || 'Secretaria';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isEvasionFormOpen, setIsEvasionFormOpen] = useState(false);
  const [editingEvasion, setEditingEvasion] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingEvasionData, setPendingEvasionData] = useState<any>(null);
  const { toast } = useToast();

  // Use Supabase hooks
  const { data: evasions, loading, createEvasion, updateEvasion, cancelEvasion } = useSupabaseEvasions();
  const { classes: realClasses } = useRealRecipients();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [evasionToCancel, setEvasionToCancel] = useState<any>(null);

  const handleCreateEvasion = async (data: any) => {
    if (!profile?.id) return;
    
    // Armazenar dados e abrir confirmação
    setPendingEvasionData(data);
    setConfirmDialogOpen(true);
  };

  const confirmCreateEvasion = async () => {
    if (!profile?.id || !pendingEvasionData) return;
    
    try {
      await createEvasion({
        student_id: pendingEvasionData.studentId,
        date: pendingEvasionData.evasionDate,
        reason: pendingEvasionData.evasionReason,
        reported_by: profile.id,
        observations: pendingEvasionData.observations,
        status: 'active'
      });

      setConfirmDialogOpen(false);
      setPendingEvasionData(null);
      setIsEvasionFormOpen(false);
    } catch (error) {
      console.error('Erro ao registrar evasão:', error);
    }
  };

  const handleEditEvasion = async (evasionData: any) => {
    if (!editingEvasion) return;
    
    try {
      await updateEvasion(editingEvasion.id, {
        reason: evasionData.evasionReason,
        observations: evasionData.observations,
      });

      setEditingEvasion(null);
      toast({
        title: "Evasão atualizada com sucesso!",
        description: `Registro de ${evasionData.studentName} foi atualizado.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const openEditForm = (evasion: any) => {
    setEditingEvasion(evasion);
    setIsEvasionFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingEvasion(null);
    setIsEvasionFormOpen(true);
  };

  const handleCancelEvasion = async () => {
    if (!evasionToCancel) return;
    
    try {
      await cancelEvasion(evasionToCancel.id, evasionToCancel.student_id);
      setCancelDialogOpen(false);
      setEvasionToCancel(null);
    } catch (error) {
      console.error('Erro ao cancelar evasão:', error);
    }
  };

  const openCancelDialog = (evasion: any) => {
    setEvasionToCancel(evasion);
    setCancelDialogOpen(true);
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Dificuldades financeiras': return 'bg-red-100 text-red-800';
      case 'Mudança de cidade': return 'bg-blue-100 text-blue-800';
      case 'Conseguiu emprego': return 'bg-green-100 text-green-800';
      case 'Insatisfação com o curso': return 'bg-orange-100 text-orange-800';
      case 'Problemas de saúde': return 'bg-purple-100 text-purple-800';
      case 'Dificuldades acadêmicas': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular estatísticas
  const totalEvasions = evasions.length;
  const thisMonthEvasions = evasions.filter(e => 
    new Date(e.date).getMonth() === new Date().getMonth()
  ).length;
  const mainReason = evasions.reduce((acc, curr) => {
    acc[curr.reason] = (acc[curr.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topReason = Object.entries(mainReason).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';
  const classesAffected = new Set(evasions.map(e => e.student_id)).size;

  // Filter evasions
  const filteredEvasions = evasions.filter(evasion => {
    if (searchTerm && !evasion.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedReason && evasion.reason !== selectedReason) {
      return false;
    }
    if (selectedClass && selectedClass !== 'all' && evasion.profiles?.class_id !== selectedClass) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'coordinator' ? 'Acompanhamento de Evasões' : 'Gerenciamento de Evasões'}
          </h1>
          {(userRole === 'admin' || userRole === 'secretary' || userRole === 'instructor') && (
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90" onClick={openCreateForm}>
              <Plus size={16} />
              Registrar Evasão
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Evasões</p>
                  <p className="text-3xl font-bold text-destructive">{totalEvasions}</p>
                </div>
                <UserX className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Este Mês</p>
                  <p className="text-3xl font-bold text-warning">{thisMonthEvasions}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turmas Afetadas</p>
                  <p className="text-3xl font-bold text-info">{classesAffected}</p>
                </div>
                <BarChart className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motivo Principal</p>
                  <p className="text-lg font-bold text-primary truncate">{topReason}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
               <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todas as turmas</SelectItem>
                  {realClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Motivo da evasão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiras">Dificuldades financeiras</SelectItem>
                  <SelectItem value="mudanca">Mudança de cidade</SelectItem>
                  <SelectItem value="emprego">Conseguiu emprego</SelectItem>
                  <SelectItem value="insatisfacao">Insatisfação com o curso</SelectItem>
                  <SelectItem value="saude">Problemas de saúde</SelectItem>
                  <SelectItem value="academicas">Dificuldades acadêmicas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Evasão</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data da Evasão</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Status</TableHead>
                  {(userRole === 'admin' || userRole === 'secretary') && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvasions.map((evasion) => (
                  <TableRow key={evasion.id}>
                    <TableCell className="font-medium">{evasion.profiles?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(evasion.reason)}`}>
                        {evasion.reason}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(evasion.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{evasion.reporter_profile?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={evasion.status === 'active' ? 'destructive' : 'secondary'}>
                        {evasion.status === 'active' ? 'Ativa' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                    {(userRole === 'admin' || userRole === 'secretary') && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditForm(evasion)}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </Button>
                          {evasion.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openCancelDialog(evasion)}
                              title="Cancelar Evasão"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Undo2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {(userRole === 'admin' || userRole === 'secretary' || userRole === 'instructor') && (
          <EvasionForm
            open={isEvasionFormOpen}
            onOpenChange={setIsEvasionFormOpen}
            onSubmit={editingEvasion ? handleEditEvasion : handleCreateEvasion}
            initialData={editingEvasion}
            mode={editingEvasion ? 'edit' : 'create'}
          />
        )}

        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Registro de Evasão</AlertDialogTitle>
              <AlertDialogDescription>
                Ao registrar esta evasão, o aluno <strong>{pendingEvasionData?.studentName}</strong> será automaticamente marcado como <strong>INATIVO</strong>.
                <br/><br/>
                <strong>Consequências:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>O aluno não aparecerá em novas chamadas</li>
                  <li>Não poderá ser alocado em novos equipamentos</li>
                  <li>Não será incluído em novas disciplinas</li>
                  <li>Todos os dados históricos serão preservados</li>
                </ul>
                <br/>
                Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCreateEvasion}>
                Confirmar Evasão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Evasão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar a evasão de <strong>{evasionToCancel?.profiles?.name}</strong>?
                <br/><br/>
                <strong>O que acontecerá:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>O status da evasão será alterado para "Cancelada"</li>
                  <li>O aluno será reativado automaticamente</li>
                  <li>O aluno voltará a aparecer nas listas de frequência</li>
                  <li>O aluno poderá receber novas alocações de equipamentos</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelEvasion}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Evasions;