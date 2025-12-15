import { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, UserX, TrendingDown, AlertTriangle, BarChart, Undo2, Download, CalendarIcon, FileText, AlertCircle } from 'lucide-react';
import { EvasionForm } from '@/components/forms/EvasionForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseEvasions } from '@/hooks/useSupabaseEvasions';
import { useRealRecipients } from '@/hooks/useRealRecipients';
import { useEvasionAlerts } from '@/hooks/useEvasionAlerts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportEvasionsToExcel } from '@/lib/evasionsExport';
import { exportEvasionsToPdf } from '@/lib/evasionsExportPdf';
import { EvasionsChart } from '@/components/charts/EvasionsChart';

const Evasions = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'secretary') as UserRole;
  const userName = profile?.name || 'Secretaria';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isEvasionFormOpen, setIsEvasionFormOpen] = useState(false);
  const [editingEvasion, setEditingEvasion] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingEvasionData, setPendingEvasionData] = useState<any>(null);
  const { toast } = useToast();

  // Use Supabase hooks
  const { data: evasions, loading, createEvasion, updateEvasion, cancelEvasion } = useSupabaseEvasions();
  const { classes: realClasses } = useRealRecipients();
  const { alerts, hasAlerts, highSeverityCount, loading: alertsLoading } = useEvasionAlerts();
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
  const filteredEvasions = useMemo(() => {
    return evasions.filter(evasion => {
      if (searchTerm && !evasion.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedReason && evasion.reason !== selectedReason) {
        return false;
      }
      if (selectedClass && selectedClass !== 'all' && evasion.profiles?.class_id !== selectedClass) {
        return false;
      }
      // Filtro por período
      if (startDate) {
        const evasionDate = new Date(evasion.date);
        if (evasionDate < startDate) return false;
      }
      if (endDate) {
        const evasionDate = new Date(evasion.date);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (evasionDate > endOfDay) return false;
      }
      return true;
    });
  }, [evasions, searchTerm, selectedReason, selectedClass, startDate, endDate]);

  const handleExportExcel = () => {
    if (filteredEvasions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há evasões para exportar com os filtros atuais.",
        variant: "destructive",
      });
      return;
    }

    exportEvasionsToExcel(
      filteredEvasions,
      realClasses,
      { startDate, endDate, reason: selectedReason || undefined }
    );

    toast({
      title: "Relatório exportado",
      description: `${filteredEvasions.length} registro(s) exportado(s) com sucesso.`,
    });
  };

  const handleExportPdf = async () => {
    if (filteredEvasions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há evasões para exportar com os filtros atuais.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportEvasionsToPdf(
        filteredEvasions,
        realClasses,
        { startDate, endDate, reason: selectedReason || undefined }
      );

      toast({
        title: "PDF gerado",
        description: `Relatório com ${filteredEvasions.length} registro(s) gerado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório PDF.",
        variant: "destructive",
      });
    }
  };

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

        {/* Alertas de Evasão */}
        {hasAlerts && !alertsLoading && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertCircle size={18} />
                Alertas de Aumento de Evasões
                {highSeverityCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {highSeverityCount} crítico(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    alert.severity === 'high' ? 'bg-red-100 dark:bg-red-950/30' : 'bg-yellow-100 dark:bg-yellow-950/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    )} />
                    <span className="font-medium">{alert.className}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{alert.currentCount}</span> evasões este mês
                    {alert.previousAverage > 0 && (
                      <span className="ml-1">
                        (média anterior: {alert.previousAverage.toFixed(1)})
                      </span>
                    )}
                    <Badge 
                      variant={alert.severity === 'high' ? 'destructive' : 'secondary'} 
                      className="ml-2"
                    >
                      +{alert.increasePercentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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

        {/* Gráfico de Tendência */}
        <EvasionsChart evasions={evasions} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportPdf} variant="outline" className="flex items-center gap-2">
                <FileText size={16} />
                Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
                <Download size={16} />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtro de Data Inicial */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {/* Filtro de Data Final */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

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
                  <SelectItem value="all">Todos os motivos</SelectItem>
                  <SelectItem value="Dificuldades financeiras">Dificuldades financeiras</SelectItem>
                  <SelectItem value="Mudança de cidade">Mudança de cidade</SelectItem>
                  <SelectItem value="Conseguiu emprego">Conseguiu emprego</SelectItem>
                  <SelectItem value="Insatisfação com o curso">Insatisfação com o curso</SelectItem>
                  <SelectItem value="Problemas de saúde">Problemas de saúde</SelectItem>
                  <SelectItem value="Dificuldades acadêmicas">Dificuldades acadêmicas</SelectItem>
                </SelectContent>
              </Select>

              {(startDate || endDate || selectedReason || selectedClass) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSelectedReason('');
                    setSelectedClass('');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
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