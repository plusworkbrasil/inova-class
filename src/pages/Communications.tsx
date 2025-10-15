import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Send, 
  Mail, 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useCommunications } from '@/hooks/useCommunications';
import { useCommunicationsStats } from '@/hooks/useCommunicationsStats';
import { useRealRecipients } from '@/hooks/useRealRecipients';



const mockCommunications = [
  {
    id: 1,
    title: 'Reunião de Pais - Março',
    message: 'Convocamos todos os pais para reunião no dia 15/03...',
    type: 'both',
    recipients: 'Todos os alunos',
    sentAt: '2024-02-01T10:00:00',
    status: 'sent',
    emailsSent: 98,
    whatsappSent: 95
  },
  {
    id: 2,
    title: 'Lembrete: Entrega de Notas',
    message: 'As notas do bimestre estarão disponíveis...',
    type: 'email',
    recipients: '1º Ano A',
    sentAt: '2024-02-02T14:30:00',
    status: 'sent',
    emailsSent: 25,
    whatsappSent: 0
  }
];

const Communications = () => {
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userName, setUserName] = useState('Usuário');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendType, setSendType] = useState<'email' | 'whatsapp' | 'both'>('both');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: communications, loading, error, createCommunication, deleteCommunication, refetch } = useCommunications();
  const { stats: commStats } = useCommunicationsStats();
  const { students: realStudents, classes: realClasses } = useRealRecipients();

  // Removed localStorage role storage for security

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleClassSelection = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId]);
      // Adicionar todos os alunos da turma
      const classStudents = realStudents
        .filter(student => {
          const selectedClass = realClasses.find(c => c.id === classId);
          return student.class === selectedClass?.name;
        })
        .map(student => student.id);
      
      setSelectedStudents([...new Set([...selectedStudents, ...classStudents])]);
    } else {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
      // Remover alunos da turma
      const classStudents = realStudents
        .filter(student => {
          const deselectedClass = realClasses.find(c => c.id === classId);
          return student.class === deselectedClass?.name;
        })
        .map(student => student.id);
      
      setSelectedStudents(selectedStudents.filter(id => !classStudents.includes(id)));
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle || !messageContent) {
      toast({
        title: "Erro",
        description: "Preencha o título e conteúdo da mensagem.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Definir público-alvo baseado no tipo de envio
      const targetAudience = ['student']; // Avisos são direcionados aos alunos

      const newCommunication = {
        title: messageTitle,
        content: messageContent,
        target_audience: targetAudience,
        priority: priority,
        is_published: true,
        expires_at: null
      };

      await createCommunication(newCommunication);

      // Limpar formulário
      setMessageTitle('');
      setMessageContent('');
      setPriority('normal');
      setSelectedStudents([]);
      setSelectedClasses([]);

    } catch (error: any) {
      toast({
        title: "Erro ao criar aviso",
        description: error.message || "Houve um problema ao criar o aviso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle size={12} className="mr-1" />Enviado</Badge>;
      case 'sending':
        return <Badge variant="secondary"><Clock size={12} className="mr-1" />Enviando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle size={12} className="mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-500" />;
      case 'whatsapp':
        return <MessageCircle size={16} className="text-green-500" />;
      case 'both':
        return <div className="flex gap-1">
          <Mail size={14} className="text-blue-500" />
          <MessageCircle size={14} className="text-green-500" />
        </div>;
      default:
        return null;
    }
  };

  const filteredStudents = realStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Comunicação e Informativos</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Emails Enviados</p>
                  <p className="text-3xl font-bold text-blue-600">{commStats.totalEmails}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp Enviados</p>
                  <p className="text-3xl font-bold text-green-600">{commStats.totalWhatsapp}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Informativos Este Mês</p>
                  <p className="text-3xl font-bold text-primary">{commStats.thisMonthCommunications}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
                  <p className="text-3xl font-bold text-success">{commStats.deliveryRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="w-full">
          <TabsList>
            <TabsTrigger value="send">Enviar Informativo</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário de Mensagem */}
              <Card>
                <CardHeader>
                  <CardTitle>Criar Informativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Título da Mensagem</label>
                    <Input
                      placeholder="Ex: Reunião de Pais - Março 2024"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Conteúdo da Mensagem</label>
                    <Textarea
                      placeholder="Digite sua mensagem aqui..."
                      rows={6}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Tipo de Envio</label>
                    <Select value={sendType} onValueChange={(value: any) => setSendType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Apenas Email</SelectItem>
                        <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
                        <SelectItem value="both">Email e WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Prioridade do Aviso</label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Urgente (Banner)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avisos urgentes aparecerão como banner no topo da tela do aluno
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Send size={16} className="mr-2" />
                    {isLoading ? 'Enviando...' : 'Enviar Informativo'}
                  </Button>
                </CardContent>
              </Card>

              {/* Seleção de Destinatários */}
              <Card>
                <CardHeader>
                  <CardTitle>Destinatários</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="classes">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="classes">Por Turma</TabsTrigger>
                      <TabsTrigger value="students">Alunos Individuais</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="classes" className="space-y-2">
                      {realClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={classItem.id}
                            checked={selectedClasses.includes(classItem.id)}
                            onCheckedChange={(checked) => handleClassSelection(classItem.id, checked as boolean)}
                          />
                          <label htmlFor={classItem.id} className="text-sm">
                            {classItem.name} ({classItem.students} alunos)
                          </label>
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="students" className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar aluno..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={student.id}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                            />
                            <label htmlFor={student.id} className="text-sm">
                              {student.name} - {student.class}
                            </label>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Selecionados: {selectedStudents.length} alunos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Informativos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatários</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Emails</TableHead>
                      <TableHead>WhatsApp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(communications || []).map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className="font-medium">{comm.title}</TableCell>
                        <TableCell>{getTypeIcon(comm.type)}</TableCell>
                        <TableCell>{comm.target_audience?.join(', ') || 'N/A'}</TableCell>
                        <TableCell>{new Date(comm.created_at).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{getStatusBadge(comm.is_published ? 'sent' : 'draft')}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteCommunication(comm.id)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Servidor SMTP</label>
                    <Input placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Porta</label>
                    <Input placeholder="587" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Remetente</label>
                    <Input placeholder="secretaria@escola.com" />
                  </div>
                  <Button>Salvar Configurações</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações WhatsApp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">API Key WhatsGW</label>
                    <Input 
                      type="password" 
                      placeholder="Sua chave da API WhatsGW.com.br" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Número do Remetente</label>
                    <Input placeholder="5511999999999" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL da API</label>
                    <Input 
                      placeholder="https://api.whatsgw.com.br" 
                      defaultValue="https://api.whatsgw.com.br"
                    />
                  </div>
                  <Button>Salvar Configurações</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Communications;