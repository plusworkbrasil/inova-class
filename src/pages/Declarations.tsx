import { useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Edit, Download, FileText, Clock, CheckCircle, XCircle, Upload, FileUp, Mail, Eye, Paperclip } from 'lucide-react';
import { DeclarationForm } from '@/components/forms/DeclarationForm';
import { StudentDeclarationForm } from '@/components/forms/StudentDeclarationForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseDeclarations } from '@/hooks/useSupabaseDeclarations';
import { supabase } from '@/integrations/supabase/client';
import { justificationStatusEmail, declarationDeliveryEmail, sendEmailViaResend } from '@/lib/email-templates';

const PAGE_SIZE_STUDENT = 10;

const formatDateBR = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatDateTimeBR = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const declarationTypeLabel = (t?: string | null) => {
  switch (t) {
    case 'atestado_medico': return 'Atestado médico';
    case 'atestado_trabalho': return 'Atestado de trabalho';
    case 'outros': return 'Outros';
    case 'medical_certificate': return 'Atestado médico';
    case 'enrollment_certificate': return 'Declaração de matrícula';
    default: return t || '—';
  }
};
const studentStatusBadge = (status?: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500 hover:bg-green-500"><CheckCircle size={12} className="mr-1" />Aprovada</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle size={12} className="mr-1" />Rejeitada</Badge>;
    case 'processing':
      return <Badge variant="secondary"><Clock size={12} className="mr-1" />Processando</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500 hover:bg-blue-500"><CheckCircle size={12} className="mr-1" />Concluída</Badge>;
    case 'pending':
    default:
      return <Badge variant="outline"><Clock size={12} className="mr-1" />Pendente</Badge>;
  }
};

const Declarations = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'student') as UserRole;
  const userName = profile?.name || profile?.email || 'User';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isDeclarationFormOpen, setIsDeclarationFormOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState<any>(null);
  const [declarationType, setDeclarationType] = useState<'request' | 'submit'>('request');
  const [studentPage, setStudentPage] = useState(1);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const { toast } = useToast();

  // Use Supabase hook
  const { data: declarations, loading, createDeclaration, updateDeclaration } = useSupabaseDeclarations();

  const notifyStudent = async (params: {
    studentId: string;
    studentEmail?: string | null;
    studentName?: string | null;
    declarationId?: string | null;
    declarationTitle: string;
    status: 'pending' | 'approved' | 'rejected' | 'processing';
    absenceDate?: string | null;
    observations?: string | null;
  }) => {
    const titleMap = {
      pending: 'Declaração enviada',
      processing: 'Declaração em análise',
      approved: 'Declaração aprovada',
      rejected: 'Declaração rejeitada',
    } as const;
    const messageMap = {
      pending: `Sua solicitação "${params.declarationTitle}" foi recebida e está aguardando análise.`,
      processing: `Sua solicitação "${params.declarationTitle}" está em processamento pela secretaria.`,
      approved: `Sua solicitação "${params.declarationTitle}" foi aprovada.`,
      rejected: `Sua solicitação "${params.declarationTitle}" foi rejeitada. Procure a secretaria para mais informações.`,
    } as const;
    const typeMap = {
      pending: 'info',
      processing: 'info',
      approved: 'success',
      rejected: 'warning',
    } as const;

    // In-app notification (best effort)
    try {
      await supabase.from('notifications').insert({
        user_id: params.studentId,
        title: titleMap[params.status],
        message: messageMap[params.status],
        type: typeMap[params.status],
        reference_id: params.declarationId || null,
        reference_type: 'declaration',
      });
    } catch (e) {
      console.error('Falha ao criar notificação in-app:', e);
    }

    // Email (only for pending/approved/rejected)
    if (params.status !== 'processing' && params.studentEmail) {
      try {
        const { subject, html } = justificationStatusEmail({
          studentName: params.studentName || 'Aluno(a)',
          status: params.status,
          declarationTitle: params.declarationTitle,
          absenceDate: params.absenceDate || null,
          observations: params.observations || null,
        });
        await sendEmailViaResend({
          to: params.studentEmail,
          subject,
          html,
          template_type: 'justification',
          reference_id: params.declarationId || undefined,
        });
      } catch (mailErr) {
        console.error('Falha ao enviar e-mail de justificativa:', mailErr);
      }
    }
  };

  const handleCreateDeclaration = async (data: any) => {
    if (!profile) return;
    
    try {
      const declarationData = {
        student_id: userRole === 'student' ? profile.id : data.studentId,
        type: data.type,
        title: data.title || data.type,
        description: data.description || data.observations,
        purpose: data.purpose,
        urgency: data.urgency,
        subject_id: data.subjectId,
        status: 'pending',
        file_path: data.filePath || null,
        delivery_date: data.absence_date || null,
      };

      const created: any = await createDeclaration(declarationData);

      // Notify admin/coordinator/tutor about new justification
      if (userRole === 'student') {
        try {
          await supabase.functions.invoke('notify-justification', {
            body: {
              declaration_id: created?.id || declarationData.student_id,
              student_name: profile?.name || 'Aluno',
            },
          });
        } catch (notifyErr) {
          console.error('Error sending notification:', notifyErr);
        }

        // Confirmação para o próprio aluno (in-app + e-mail)
        await notifyStudent({
          studentId: profile.id,
          studentEmail: profile.email,
          studentName: profile.name,
          declarationId: created?.id || null,
          declarationTitle: declarationData.title,
          status: 'pending',
          absenceDate: declarationData.delivery_date,
          observations: declarationData.description,
        });
      } else if (declarationData.student_id) {
        // Admin/secretary criando em nome do aluno: avisa o aluno também
        try {
          const { data: studentRow } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', declarationData.student_id)
            .maybeSingle();
          await notifyStudent({
            studentId: declarationData.student_id,
            studentEmail: studentRow?.email,
            studentName: studentRow?.name,
            declarationId: created?.id || null,
            declarationTitle: declarationData.title,
            status: 'pending',
            absenceDate: declarationData.delivery_date,
            observations: declarationData.description,
          });
        } catch (e) {
          console.error('Falha ao notificar aluno:', e);
        }
      }
      
      const actionText = declarationType === 'submit' ? 'enviado' : 'solicitada';
      toast({
        title: `Documento ${actionText} com sucesso!`,
        description: `${declarationType === 'submit' ? 'Envio' : 'Solicitação'} de ${data.type} registrada.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditDeclaration = async (declarationData: any) => {
    if (!editingDeclaration) return;
    
    try {
      await updateDeclaration(editingDeclaration.id, {
        title: declarationData.type,
        description: declarationData.observations,
        purpose: declarationData.purpose,
        urgency: declarationData.urgency,
      });

      setEditingDeclaration(null);
      toast({
        title: "Declaração atualizada com sucesso!",
        description: "Declaração foi atualizada.",
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleStatusChange = async (declarationId: string, newStatus: string) => {
    if (!profile) return;
    
    try {
      const updateData: any = {
        status: newStatus,
        processed_by: profile.id,
        processed_at: new Date().toISOString()
      };
      
      if (newStatus === 'approved') {
        updateData.delivery_date = new Date().toISOString().split('T')[0];
      }

      await updateDeclaration(declarationId, updateData);

      // If approved, automatically update attendance record
      if (newStatus === 'approved') {
        const declaration = declarations.find(d => d.id === declarationId);
        if (declaration) {
          const absenceDate = declaration.delivery_date || declaration.purpose?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
          
          if (absenceDate) {
            // Find matching attendance record
            const { data: attendanceRecords, error: attError } = await supabase
              .from('attendance')
              .select('id')
              .eq('student_id', declaration.student_id)
              .eq('date', absenceDate)
              .eq('is_present', false);

            if (!attError && attendanceRecords && attendanceRecords.length > 0) {
              const justificationText = `Falta justificada - ${declaration.title}${declaration.file_path ? ` [doc:${declaration.file_path}]` : ''}`;
              
              for (const record of attendanceRecords) {
                await supabase
                  .from('attendance')
                  .update({ justification: justificationText })
                  .eq('id', record.id);
              }
              
              toast({
                title: "Frequência atualizada!",
                description: `${attendanceRecords.length} registro(s) de falta atualizado(s) como justificada(s).`,
              });
            } else if (!attError && (!attendanceRecords || attendanceRecords.length === 0)) {
              toast({
                title: "Aviso",
                description: "Nenhum registro de falta encontrado para a data informada.",
                variant: "destructive",
              });
            }
          }
        }
      }

      // Notifica o aluno (in-app + e-mail quando aplicável)
      try {
        const decl = declarations.find((d) => d.id === declarationId);
        if (decl && ['approved', 'rejected', 'processing'].includes(newStatus)) {
          const { data: studentRow } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', decl.student_id)
            .maybeSingle();
          const absenceDate =
            decl.delivery_date ||
            decl.purpose?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ||
            null;
          await notifyStudent({
            studentId: decl.student_id,
            studentEmail: studentRow?.email,
            studentName: studentRow?.name,
            declarationId: decl.id,
            declarationTitle: decl.title || decl.type || 'Justificativa',
            status: newStatus as 'approved' | 'rejected' | 'processing',
            absenceDate,
            observations: decl.description || null,
          });
        }
      } catch (notifyErr) {
        console.error('Falha ao notificar aluno:', notifyErr);
      }

      toast({
        title: "Status atualizado!",
        description: `Declaração ${newStatus === 'approved' ? 'aprovada' : newStatus === 'rejected' ? 'rejeitada' : 'em processamento'}.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const openEditForm = (declaration: any) => {
    setEditingDeclaration(declaration);
    setIsDeclarationFormOpen(true);
  };

  const openCreateForm = (type: 'request' | 'submit' = 'request') => {
    setDeclarationType(type);
    setEditingDeclaration(null);
    setIsDeclarationFormOpen(true);
  };

  const handleEmailDeclaration = async (declaration: any) => {
    if (!declaration?.file_path) {
      toast({ title: 'Sem anexo', description: 'Esta declaração não possui arquivo para enviar.', variant: 'destructive' });
      return;
    }
    try {
      const { data: studentRow } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', declaration.student_id)
        .maybeSingle();
      if (!studentRow?.email) {
        toast({ title: 'Aluno sem e-mail cadastrado', variant: 'destructive' });
        return;
      }

      // Baixa arquivo do storage e converte para base64
      const { data: fileBlob, error: dlErr } = await supabase
        .storage
        .from('declarations')
        .download(declaration.file_path);
      if (dlErr || !fileBlob) throw dlErr || new Error('Falha ao baixar arquivo');

      const buf = await fileBlob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const base64 = btoa(binary);

      const filename = declaration.file_path.split('/').pop() || 'declaracao.pdf';

      const { subject, html } = declarationDeliveryEmail({
        studentName: studentRow.name || 'Aluno(a)',
        declarationTitle: declaration.title || declaration.type || 'Declaração',
      });

      const { error: sendErr } = await sendEmailViaResend({
        to: studentRow.email,
        subject,
        html,
        template_type: 'declaration',
        reference_id: declaration.id,
        attachments: [{ filename, content: base64 }],
      });
      if (sendErr) throw sendErr;
      toast({ title: 'Declaração enviada por e-mail', description: studentRow.email });
    } catch (e: any) {
      toast({ title: 'Falha ao enviar', description: e?.message || 'Erro desconhecido', variant: 'destructive' });
    }
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
    if (searchTerm && !declaration.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
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

  // Student view: histórico de declarações embutido
  if ((userRole as string) === 'student') {
    const studentFiltered = declarations.filter((d) => {
      if (selectedStatus && d.status !== selectedStatus) return false;
      if (selectedType && d.type !== selectedType) return false;
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const haystack = `${d.title || ''} ${d.description || ''} ${d.purpose || ''} ${declarationTypeLabel(d.type)}`.toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
    const stStats = {
      total: declarations.length,
      pending: declarations.filter((d) => d.status === 'pending').length,
      approved: declarations.filter((d) => d.status === 'approved').length,
      rejected: declarations.filter((d) => d.status === 'rejected').length,
    };
    const stTotalPages = Math.max(1, Math.ceil(studentFiltered.length / PAGE_SIZE_STUDENT));
    const stCurrentPage = Math.min(studentPage, stTotalPages);
    const stPageItems = studentFiltered.slice((stCurrentPage - 1) * PAGE_SIZE_STUDENT, stCurrentPage * PAGE_SIZE_STUDENT);

    const handleStudentDownload = async (filePath: string) => {
      try {
        const { data, error } = await supabase.storage.from('declarations').createSignedUrl(filePath, 60);
        if (error || !data?.signedUrl) throw error || new Error('Sem URL');
        window.open(data.signedUrl, '_blank');
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Não foi possível abrir o anexo', description: e?.message || 'Tente novamente em instantes.' });
      }
    };

    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">Minhas Declarações</h1>
              <p className="text-sm text-muted-foreground">
                Solicite novas declarações e acompanhe o histórico das suas justificativas.
              </p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => openCreateForm('request')}>
              <Plus size={16} />
              Nova Solicitação
            </Button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs font-medium text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{stStats.total}</p></div>
              <FileText className="h-7 w-7 text-primary" />
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs font-medium text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-warning">{stStats.pending}</p></div>
              <Clock className="h-7 w-7 text-warning" />
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs font-medium text-muted-foreground">Aprovadas</p><p className="text-2xl font-bold text-success">{stStats.approved}</p></div>
              <CheckCircle className="h-7 w-7 text-success" />
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs font-medium text-muted-foreground">Rejeitadas</p><p className="text-2xl font-bold text-destructive">{stStats.rejected}</p></div>
              <XCircle className="h-7 w-7 text-destructive" />
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, motivo ou descrição..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setStudentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setStudentPage(1); }}>
                  <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType || 'all'} onValueChange={(v) => { setSelectedType(v === 'all' ? '' : v); setStudentPage(1); }}>
                  <SelectTrigger className="md:w-56"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="atestado_medico">Atestado médico</SelectItem>
                    <SelectItem value="atestado_trabalho">Atestado de trabalho</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                    <SelectItem value="enrollment_certificate">Declaração de matrícula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico de declarações</CardTitle></CardHeader>
            <CardContent>
              {stPageItems.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">Nenhuma declaração encontrada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Enviada em</TableHead>
                        <TableHead>Processada em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Anexo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stPageItems.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-sm">{declarationTypeLabel(d.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[260px] truncate">{d.title || '—'}</TableCell>
                          <TableCell className="text-sm">{formatDateTimeBR(d.requested_at || d.created_at)}</TableCell>
                          <TableCell className="text-sm">{formatDateTimeBR(d.processed_at)}</TableCell>
                          <TableCell>{studentStatusBadge(d.status)}</TableCell>
                          <TableCell>
                            {d.file_path ? (
                              <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleStudentDownload(d.file_path!)}>
                                <Download className="w-4 h-4" />
                                <span className="text-xs">Baixar</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> Sem anexo
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => setStudentDetail(d)}>
                              <Eye className="w-4 h-4" />
                              <span className="text-xs">Detalhes</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {stTotalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                          className={stCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: stTotalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={stCurrentPage === i + 1}
                            onClick={() => setStudentPage(i + 1)}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setStudentPage((p) => Math.min(stTotalPages, p + 1))}
                          className={stCurrentPage === stTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <StudentDeclarationForm
          open={isDeclarationFormOpen}
          onOpenChange={setIsDeclarationFormOpen}
          onSubmit={handleCreateDeclaration}
          currentUser={{
            id: profile?.id || '',
            name: profile?.name || '',
            studentId: profile?.student_id || (profile as any)?.auto_student_id?.toString() || ''
          }}
        />

        <Dialog open={!!studentDetail} onOpenChange={(o) => !o && setStudentDetail(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da declaração</DialogTitle>
              <DialogDescription>Informações completas da solicitação enviada.</DialogDescription>
            </DialogHeader>
            {studentDetail && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {studentStatusBadge(studentDetail.status)}
                </div>
                <div><p className="text-muted-foreground">Tipo</p><p className="font-medium">{declarationTypeLabel(studentDetail.type)}</p></div>
                <div><p className="text-muted-foreground">Título</p><p className="font-medium">{studentDetail.title || '—'}</p></div>
                {studentDetail.purpose && (
                  <div><p className="text-muted-foreground">Finalidade / Data da falta</p><p className="font-medium whitespace-pre-wrap">{studentDetail.purpose}</p></div>
                )}
                {studentDetail.description && (
                  <div><p className="text-muted-foreground">Descrição</p><p className="whitespace-pre-wrap">{studentDetail.description}</p></div>
                )}
                {studentDetail.observations && (
                  <div><p className="text-muted-foreground">Observações da secretaria</p><p className="whitespace-pre-wrap">{studentDetail.observations}</p></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground">Enviada em</p><p>{formatDateTimeBR(studentDetail.requested_at || studentDetail.created_at)}</p></div>
                  <div><p className="text-muted-foreground">Processada em</p><p>{formatDateTimeBR(studentDetail.processed_at)}</p></div>
                </div>
                {studentDetail.delivery_date && (
                  <div><p className="text-muted-foreground">Data de entrega</p><p>{formatDateBR(studentDetail.delivery_date)}</p></div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Anexo</p>
                  {studentDetail.file_path ? (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleStudentDownload(studentDetail.file_path!)}>
                      <Download className="w-4 h-4" />
                      Baixar anexo
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">Sem anexo enviado.</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
           {userRole === 'student' ? (
             <Button 
               className="flex items-center gap-2" 
               onClick={() => openCreateForm('request')}
               variant="default"
             >
               <Plus size={16} />
               Nova Solicitação
             </Button>
           ) : userRole !== 'instructor' && (
            <Button className="flex items-center gap-2" onClick={() => openCreateForm('request')}>
              <Plus size={16} />
              Nova Solicitação
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
                  {userRole !== 'student' && <TableHead>Aluno</TableHead>}
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anexo</TableHead>
                  {(userRole === 'admin' || userRole === 'secretary') && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeclarations.map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {declaration.type?.includes('Envio') ? (
                          <FileUp className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-green-500" />
                        )}
                        {declaration.title}
                      </div>
                    </TableCell>
                    {userRole !== 'student' && <TableCell>{declaration.profiles?.name || 'N/A'}</TableCell>}
                    <TableCell>
                      {declaration.created_at ? new Date(declaration.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(declaration.status)}</TableCell>
                    <TableCell>
                      {declaration.file_path ? (
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          <span className="text-xs">Baixar</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem anexo</span>
                      )}
                    </TableCell>
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
                          {declaration.file_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmailDeclaration(declaration)}
                              title="Enviar por e-mail"
                            >
                              <Mail size={14} />
                            </Button>
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
        
        {userRole === 'student' ? (
          <StudentDeclarationForm
            open={isDeclarationFormOpen}
            onOpenChange={setIsDeclarationFormOpen}
            onSubmit={handleCreateDeclaration}
            currentUser={{
              id: profile?.id || '',
              name: profile?.name || '',
              studentId: profile?.student_id || (profile as any)?.auto_student_id?.toString() || ''
            }}
          />
        ) : userRole !== 'instructor' && (
          <DeclarationForm
            open={isDeclarationFormOpen}
            onOpenChange={setIsDeclarationFormOpen}
            onSubmit={editingDeclaration ? handleEditDeclaration : handleCreateDeclaration}
            initialData={editingDeclaration}
            mode={editingDeclaration ? 'edit' : 'create'}
            declarationType={declarationType}
            userRole={userRole}
            currentUser={{
              id: profile?.id || '',
              name: profile?.name || '',
              studentId: profile?.student_id || (profile as any)?.auto_student_id?.toString() || ''
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Declarations;