import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Download, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { DeclarationForm } from '@/components/forms/DeclarationForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const Declarations = () => {
  const { user } = useAuth();
  const userRole = (user?.role || 'student') as UserRole;
  const userName = user?.name || user?.email || 'User';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isDeclarationFormOpen, setIsDeclarationFormOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState<any>(null);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && userRole) {
      fetchDeclarations();
    }
  }, [user, userRole]);

  const fetchDeclarations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('declarations');
      setDeclarations(data || []);
    } catch (error) {
      console.error('Error fetching declarations:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar declarações.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeclaration = async (data: any) => {
    if (!user) return;
    
    try {
      const declarationData = {
        student_id: userRole === 'student' ? user.id : data.studentId,
        type: data.type === 'Declaração de Matrícula' ? 'enrollment_certificate' : 'medical_certificate',
        title: data.type,
        description: data.observations,
        purpose: data.purpose,
        urgency: data.urgency,
        subject_id: data.subjectId,
        status: 'pending'
      };

      await apiClient.create('declarations', declarationData);
      await fetchDeclarations();
      
      toast({
        title: "Declaração solicitada com sucesso!",
        description: `Solicitação de ${data.type} registrada.`,
      });
    } catch (error) {
      console.error('Error creating declaration:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar declaração.",
      });
    }
  };

  const handleEditDeclaration = async (declarationData: any) => {
    if (!editingDeclaration) return;
    
    try {
      await apiClient.update('declarations', editingDeclaration.id, {
        title: declarationData.type,
        description: declarationData.observations,
        purpose: declarationData.purpose,
        urgency: declarationData.urgency,
      });

      await fetchDeclarations();
      setEditingDeclaration(null);
      
      toast({
        title: "Declaração atualizada com sucesso!",
        description: "Declaração foi atualizada.",
      });
    } catch (error) {
      console.error('Error updating declaration:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar declaração.",
      });
    }
  };

  const handleStatusChange = async (declarationId: string, newStatus: string) => {
    if (!user) return;
    
    try {
      const updateData: any = {
        status: newStatus,
        processed_by: user.id,
        processed_at: new Date().toISOString()
      };
      
      if (newStatus === 'approved') {
        updateData.delivery_date = new Date().toISOString().split('T')[0];
      }

      await apiClient.update('declarations', declarationId, updateData);
      await fetchDeclarations();
      
      toast({
        title: "Status atualizado!",
        description: `Declaração ${newStatus === 'approved' ? 'aprovada' : newStatus === 'rejected' ? 'rejeitada' : 'em processamento'}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status.",
      });
    }
  };

  const openEditForm = (declaration: any) => {
    setEditingDeclaration(declaration);
    setIsDeclarationFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingDeclaration(null);
    setIsDeclarationFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle size={12} className="mr-1" />Aprovada</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock size={12} className="mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock size={12} className="mr-1" />Processando</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle size={12} className="mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter declarations based on search and filters
  const filteredDeclarations = declarations.filter(declaration => {
    if (searchTerm && !declaration.student_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedStatus && declaration.status !== selectedStatus) {
      return false;
    }
    if (selectedType && declaration.type !== selectedType) {
      return false;
    }
    return true;
  });

  // Calcular estatísticas
  const totalDeclarations = filteredDeclarations.length;
  const pendingDeclarations = filteredDeclarations.filter(d => d.status === 'pending').length;
  const approvedDeclarations = filteredDeclarations.filter(d => d.status === 'approved').length;
  const processingDeclarations = filteredDeclarations.filter(d => d.status === 'processing').length;

  if (loading) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="space-y-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <p>Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'student' ? 'Minhas Declarações' : 
             userRole === 'instructor' ? 'Declarações das Minhas Disciplinas' : 
             'Gerenciamento de Declarações'}
          </h1>
          {userRole !== 'instructor' && (
            <Button className="flex items-center gap-2" onClick={openCreateForm}>
              <Plus size={16} />
              {userRole === 'student' ? 'Solicitar Declaração' : 'Nova Solicitação'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Minhas Declarações' : 'Total de Declarações'}
                  </p>
                  <p className="text-3xl font-bold text-primary">{totalDeclarations}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-warning">{pendingDeclarations}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                  <p className="text-3xl font-bold text-success">{approvedDeclarations}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Processamento</p>
                  <p className="text-3xl font-bold text-info">{processingDeclarations}</p>
                </div>
                <Clock className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        {(userRole === 'admin' || userRole === 'secretary') && (
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
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Tipo de declaração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matricula">Declaração de Matrícula</SelectItem>
                    <SelectItem value="frequencia">Declaração de Frequência</SelectItem>
                    <SelectItem value="historico">Histórico Escolar</SelectItem>
                    <SelectItem value="conclusao">Declaração de Conclusão</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">Filtrar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Declarações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  {(userRole === 'admin' || userRole === 'secretary') && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeclarations.map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell className="font-medium">{declaration.title}</TableCell>
                    <TableCell>{declaration.student_name || 'N/A'}</TableCell>
                    <TableCell>
                      {declaration.created_at ? new Date(declaration.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(declaration.status)}</TableCell>
                    {(userRole === 'admin' || userRole === 'secretary') && (
                      <TableCell>
                        <div className="flex gap-2">
                          {declaration.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(declaration.id, 'approved')}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(declaration.id, 'rejected')}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditForm(declaration)}
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {userRole !== 'instructor' && (
          <DeclarationForm
            open={isDeclarationFormOpen}
            onOpenChange={setIsDeclarationFormOpen}
            onSubmit={editingDeclaration ? handleEditDeclaration : handleCreateDeclaration}
            initialData={editingDeclaration}
            mode={editingDeclaration ? 'edit' : 'create'}
          />
        )}
      </div>
    </Layout>
  );
};

export default Declarations;