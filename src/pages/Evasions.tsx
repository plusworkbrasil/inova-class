import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, UserX, TrendingDown, AlertTriangle, BarChart } from 'lucide-react';
import { EvasionForm } from '@/components/forms/EvasionForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useEvasions } from '@/hooks/useEvasions';
import { supabase } from '@/integrations/supabase/client';

const mockEvasionsData = [
  {
    id: 1,
    studentName: 'Carlos Mendes',
    studentId: '2024010',
    class: '1º Ano A',
    evasionReason: 'Dificuldades financeiras',
    evasionDate: '2024-01-20',
    registeredBy: 'Secretaria Maria',
    registeredAt: '2024-01-20',
    observations: 'Aluno relatou dificuldades para pagamento das mensalidades'
  },
  {
    id: 2,
    studentName: 'Fernanda Lima',
    studentId: '2024015',
    class: '2º Ano B',
    evasionReason: 'Mudança de cidade',
    evasionDate: '2024-01-18',
    registeredBy: 'Secretaria João',
    registeredAt: '2024-01-18',
    observations: 'Família se mudou para outro estado por motivos profissionais'
  },
  {
    id: 3,
    studentName: 'Roberto Silva',
    studentId: '2024008',
    class: '3º Ano A',
    evasionReason: 'Conseguiu emprego',
    evasionDate: '2024-01-15',
    registeredBy: 'Secretaria Maria',
    registeredAt: '2024-01-15',
    observations: 'Conseguiu oportunidade de trabalho em horário integral'
  },
  {
    id: 4,
    studentName: 'Ana Beatriz',
    studentId: '2024012',
    class: '1º Ano B',
    evasionReason: 'Insatisfação com o curso',
    evasionDate: '2024-01-10',
    registeredBy: 'Secretaria João',
    registeredAt: '2024-01-10',
    observations: 'Relatou que o curso não atendia suas expectativas'
  },
];

const Evasions = () => {
  const [userRole, setUserRole] = useState<UserRole>('secretary');
  const [userName, setUserName] = useState('Secretaria Maria');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isEvasionFormOpen, setIsEvasionFormOpen] = useState(false);
  const [editingEvasion, setEditingEvasion] = useState<any>(null);
  const { data: evasions, loading, error, refetch } = useEvasions();
  const { toast } = useToast();

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }
  }, []);

  const handleCreateEvasion = async (data: any) => {
    try {
      const { error } = await supabase
        .from('evasions')
        .insert({
          student_id: data.studentId,
          date: data.evasionDate,
          reason: data.evasionReason,
          reported_by: userRole,
          observations: data.observations,
          status: 'active'
        });

      if (error) throw error;

      await refetch();
      toast({
        title: "Evasão registrada com sucesso!",
        description: `Evasão de ${data.studentName} foi registrada.`,
      });
    } catch (error) {
      console.error('Erro ao criar evasão:', error);
      toast({
        title: "Erro ao registrar evasão",
        description: "Não foi possível registrar a evasão.",
        variant: "destructive",
      });
    }
  };

  const handleEditEvasion = async (evasionData: any) => {
    if (!editingEvasion) return;
    
    try {
      const { error } = await supabase
        .from('evasions')
        .update({
          reason: evasionData.evasionReason,
          observations: evasionData.observations,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEvasion.id);

      if (error) throw error;

      await refetch();
      setEditingEvasion(null);
      toast({
        title: "Evasão atualizada com sucesso!",
        description: `Registro de ${evasionData.studentName} foi atualizado.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar evasão:', error);
      toast({
        title: "Erro ao atualizar evasão",
        description: "Não foi possível atualizar a evasão.",
        variant: "destructive",
      });
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
  const totalEvasions = (evasions || []).length;
  const thisMonthEvasions = (evasions || []).filter(e => 
    new Date(e.date).getMonth() === new Date().getMonth()
  ).length;
  const mainReason = (evasions || []).reduce((acc, curr) => {
    acc[curr.reason] = (acc[curr.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topReason = Object.entries(mainReason).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';
  const classesAffected = new Set((evasions || []).map(e => e.student?.class_id)).size;

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'coordinator' ? 'Acompanhamento de Evasões' : 'Gerenciamento de Evasões'}
          </h1>
          {userRole === 'secretary' && (
            <Button className="flex items-center gap-2" onClick={openCreateForm}>
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
                  <SelectItem value="1a">1º Ano A</SelectItem>
                  <SelectItem value="1b">1º Ano B</SelectItem>
                  <SelectItem value="2a">2º Ano A</SelectItem>
                  <SelectItem value="2b">2º Ano B</SelectItem>
                  <SelectItem value="3a">3º Ano A</SelectItem>
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
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data da Evasão</TableHead>
                  <TableHead>Registrado por</TableHead>
                  {userRole === 'secretary' && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(evasions || []).map((evasion) => (
                  <TableRow key={evasion.id}>
                    <TableCell className="font-medium">{evasion.student?.name || 'N/A'}</TableCell>
                    <TableCell>{evasion.student?.student_id || 'N/A'}</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(evasion.reason)}`}>
                        {evasion.reason}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(evasion.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{evasion.reported_by_profile?.name || 'N/A'}</TableCell>
                    {userRole === 'secretary' && (
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditForm(evasion)}
                        >
                          <Edit size={14} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {userRole === 'secretary' && (
          <EvasionForm
            open={isEvasionFormOpen}
            onOpenChange={setIsEvasionFormOpen}
            onSubmit={editingEvasion ? handleEditEvasion : handleCreateEvasion}
            initialData={editingEvasion}
            mode={editingEvasion ? 'edit' : 'create'}
          />
        )}
      </div>
    </Layout>
  );
};

export default Evasions;