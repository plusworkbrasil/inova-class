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
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const mockDeclarationsData = [
  {
    id: 1,
    studentName: 'João Silva',
    studentId: '2024001',
    class: '1º Ano A',
    subject: 'Matemática',
    type: 'Declaração de Matrícula',
    status: 'approved',
    requestDate: '2024-01-15',
    deliveryDate: '2024-01-16',
    requestedBy: 'Aluno',
    purpose: 'Apresentar no trabalho',
    observations: 'Urgente para processo seletivo'
  },
  {
    id: 2,
    studentName: 'Maria Santos',
    studentId: '2024002',
    class: '2º Ano B',
    subject: 'Física',
    type: 'Declaração de Frequência',
    status: 'pending',
    requestDate: '2024-01-14',
    deliveryDate: null,
    requestedBy: 'Responsável',
    purpose: 'Bolsa de estudos',
    observations: ''
  },
  {
    id: 3,
    studentName: 'Pedro Oliveira',
    studentId: '2024003',
    class: '3º Ano C',
    subject: 'História',
    type: 'Histórico Escolar',
    status: 'processing',
    requestDate: '2024-01-13',
    deliveryDate: null,
    requestedBy: 'Aluno',
    purpose: 'Transferência de escola',
    observations: 'Incluir notas parciais do semestre'
  },
  {
    id: 4,
    studentName: 'Ana Costa',
    studentId: '2024004',
    class: '1º Ano A',
    subject: 'Matemática',
    type: 'Declaração de Conclusão',
    status: 'rejected',
    requestDate: '2024-01-12',
    deliveryDate: null,
    requestedBy: 'Responsável',
    purpose: 'Curso técnico',
    observations: 'Aluno ainda não concluiu o curso'
  },
];

const Declarations = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isDeclarationFormOpen, setIsDeclarationFormOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState<any>(null);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDeclarations();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar perfil do usuário.",
      });
    }
  };

  const fetchDeclarations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('declarations')
        .select(`
          *,
          student:profiles!declarations_student_id_fkey(name, email, student_id),
          processed_by_profile:profiles!declarations_processed_by_fkey(name)
        `);
      
      // Filter based on user role
      if (userRole === 'student') {
        query = query.eq('student_id', user.id);
      } else if (userRole === 'instructor') {
        // Instructors can only see medical certificates from their subjects
        query = query
          .eq('type', 'medical_certificate')
          .contains('subject_id', profile?.instructor_subjects || []);
      }
      // Admins and secretaries can see all declarations
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
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
    if (!user || !profile) return;
    
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

      const { error } = await supabase
        .from('declarations')
        .insert([declarationData]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('declarations')
        .update({
          title: declarationData.type,
          description: declarationData.observations,
          purpose: declarationData.purpose,
          urgency: declarationData.urgency,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDeclaration.id);

      if (error) throw error;

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

      const { error } = await supabase
        .from('declarations')
        .update(updateData)
        .eq('id', declarationId);

      if (error) throw error;

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Declaração de Matrícula': return 'bg-blue-100 text-blue-800';
      case 'Declaração de Frequência': return 'bg-green-100 text-green-800';
      case 'Histórico Escolar': return 'bg-purple-100 text-purple-800';
      case 'Declaração de Conclusão': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter declarations based on search and filters
  const filteredDeclarations = declarations.filter(declaration => {
    if (searchTerm && !declaration.student?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
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

  return (
    <Layout userRole={userRole} userName={profile?.name || user?.email || ''} userAvatar="">
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
            <CardTitle>
              {userRole === 'student' ? 'Minhas Solicitações' : 'Solicitações de Declarações'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
               <TableRow>
                  {userRole !== 'student' && <TableHead>Aluno</TableHead>}
                  {userRole !== 'student' && <TableHead>Matrícula</TableHead>}
                      {userRole === 'instructor' && (
                        <>
                          <TableHead>Turma</TableHead>
                          <TableHead>Disciplina</TableHead>
                        </>
                      )}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-center py-8">
                       Carregando declarações...
                     </TableCell>
                   </TableRow>
                 ) : filteredDeclarations.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={8} className="text-center py-8">
                       Nenhuma declaração encontrada.
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredDeclarations.map((declaration) => (
                     <TableRow key={declaration.id}>
                       {userRole !== 'student' && <TableCell className="font-medium">{declaration.student?.name}</TableCell>}
                       {userRole !== 'student' && <TableCell>{declaration.student?.student_id}</TableCell>}
                       {userRole === 'instructor' && (
                         <>
                           <TableCell>-</TableCell>
                           <TableCell>{declaration.subject_id}</TableCell>
                         </>
                       )}
                       <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(declaration.title)}`}>
                          {declaration.title}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(declaration.status)}</TableCell>
                      <TableCell>{new Date(declaration.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {declaration.delivery_date ? new Date(declaration.delivery_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>Aluno</TableCell>
                    <TableCell>
                       <div className="flex gap-2">
                         {(userRole === 'admin' || userRole === 'secretary') && (
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => openEditForm(declaration)}
                           >
                             <Edit size={14} />
                           </Button>
                         )}
                         {declaration.status === 'pending' && (userRole === 'admin' || userRole === 'secretary') && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(declaration.id, 'approved')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(declaration.id, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle size={14} />
                            </Button>
                          </>
                        )}
                        {declaration.status === 'approved' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {userRole !== 'instructor' && user && (
          <DeclarationForm
            open={isDeclarationFormOpen}
            onOpenChange={setIsDeclarationFormOpen}
            onSubmit={editingDeclaration ? handleEditDeclaration : handleCreateDeclaration}
            initialData={editingDeclaration}
            mode={editingDeclaration ? 'edit' : 'create'}
            userRole={userRole}
            currentUser={{
              id: user.id,
              name: profile?.name || user.email || '',
              studentId: profile?.student_id || ''
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Declarations;