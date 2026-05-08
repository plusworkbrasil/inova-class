import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FileCheck, FileText, Clock, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseDeclarations } from '@/hooks/useSupabaseDeclarations';
import { supabase } from '@/integrations/supabase/client';
import { justificationStatusEmail, sendEmailViaResend } from '@/lib/email-templates';
import { UserRole } from '@/types/user';

const PAGE_SIZE = 10;

const ABSENCE_TYPES = ['medical_certificate', 'work_certificate', 'absence_justification', 'justificativa_falta', 'atestado'];

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

const AbsenceJustifications = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || profile?.email || 'User';
  const { toast } = useToast();
  const { data: declarations, loading, updateDeclaration } = useSupabaseDeclarations();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeDecl, setActiveDecl] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (declarations || []).filter((d: any) => {
      // Only justifications: have file or matching type
      const isJustif = !!d.file_path || ABSENCE_TYPES.includes((d.type || '').toLowerCase());
      if (!isJustif) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (search && !(d.profiles?.name || '').toLowerCase().includes(search.toLowerCase())) return false;
      const date = d.delivery_date || d.requested_at?.split('T')[0];
      if (startDate && date && date < startDate) return false;
      if (endDate && date && date > endDate) return false;
      return true;
    });
  }, [declarations, search, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter((d: any) => d.status === 'pending').length,
    approved: filtered.filter((d: any) => d.status === 'approved').length,
    rejected: filtered.filter((d: any) => d.status === 'rejected').length,
  }), [filtered]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500"><CheckCircle size={12} className="mr-1" />Aprovada</Badge>;
      case 'pending': return <Badge variant="outline"><Clock size={12} className="mr-1" />Pendente</Badge>;
      case 'processing': return <Badge variant="secondary"><Clock size={12} className="mr-1" />Processando</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle size={12} className="mr-1" />Rejeitada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewFile = async (decl: any) => {
    if (!decl.file_path) {
      toast({ title: 'Sem anexo', description: 'Esta justificativa não possui arquivo.', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase.storage.from('declarations').createSignedUrl(decl.file_path, 300);
      if (error || !data?.signedUrl) throw error || new Error('Falha ao gerar URL');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Erro ao abrir documento', description: e?.message || 'Erro desconhecido', variant: 'destructive' });
    }
  };

  const notifyStudent = async (decl: any, status: 'approved' | 'rejected', observations?: string | null) => {
    try {
      const { data: studentRow } = await supabase
        .from('profiles').select('email, name').eq('id', decl.student_id).maybeSingle();
      const titleMap = { approved: 'Justificativa aprovada', rejected: 'Justificativa rejeitada' } as const;
      const messageMap = {
        approved: `Sua justificativa "${decl.title || decl.type}" foi aprovada.`,
        rejected: `Sua justificativa "${decl.title || decl.type}" foi rejeitada.${observations ? ' Motivo: ' + observations : ''}`,
      } as const;
      await supabase.from('notifications').insert({
        user_id: decl.student_id,
        title: titleMap[status],
        message: messageMap[status],
        type: status === 'approved' ? 'justification_approved' : 'justification_rejected',
        reference_id: decl.id,
        reference_type: 'declaration',
      });
      if (studentRow?.email) {
        const { subject, html } = justificationStatusEmail({
          studentName: studentRow.name || 'Aluno(a)',
          status,
          declarationTitle: decl.title || decl.type || 'Justificativa',
          absenceDate: decl.delivery_date || null,
          observations: observations || null,
        });
        await sendEmailViaResend({
          to: studentRow.email, subject, html,
          template_type: 'justification', reference_id: decl.id,
        });
      }
    } catch (e) {
      console.error('Falha ao notificar aluno:', e);
    }
  };

  const handleApprove = async (decl: any) => {
    if (!profile) return;
    setBusyId(decl.id);
    try {
      await updateDeclaration(decl.id, {
        status: 'approved',
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
        delivery_date: decl.delivery_date || new Date().toISOString().split('T')[0],
      } as any);

      // Atualiza frequência se houver data da falta
      const absenceDate = decl.delivery_date || decl.purpose?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (absenceDate) {
        const { data: records } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', decl.student_id)
          .eq('date', absenceDate)
          .eq('is_present', false);
        if (records && records.length > 0) {
          const justificationText = `Falta justificada - ${decl.title || decl.type}${decl.file_path ? ` [doc:${decl.file_path}]` : ''}`;
          for (const r of records) {
            await supabase.from('attendance').update({ justification: justificationText }).eq('id', r.id);
          }
          toast({ title: 'Frequência atualizada', description: `${records.length} registro(s) marcado(s) como justificado(s).` });
        }
      }

      await notifyStudent(decl, 'approved');
      toast({ title: 'Justificativa aprovada' });
    } catch (e: any) {
      toast({ title: 'Erro ao aprovar', description: e?.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (decl: any) => {
    setActiveDecl(decl);
    setRejectReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!activeDecl || !profile) return;
    setBusyId(activeDecl.id);
    try {
      await updateDeclaration(activeDecl.id, {
        status: 'rejected',
        processed_by: profile.id,
        processed_at: new Date().toISOString(),
        observations: rejectReason || null,
      } as any);
      await notifyStudent(activeDecl, 'rejected', rejectReason);
      toast({ title: 'Justificativa rejeitada' });
      setRejectOpen(false);
    } catch (e: any) {
      toast({ title: 'Erro ao rejeitar', description: e?.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Validar Justificativas de Falta</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-warning">{stats.pending}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aprovadas</p><p className="text-2xl font-bold text-green-600">{stats.approved}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rejeitadas</p><p className="text-2xl font-bold text-destructive">{stats.rejected}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <Label className="text-xs">Buscar aluno</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Nome do aluno" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Label className="text-xs">Data final</Label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); setStartDate(''); setEndDate(''); setPage(1); }}>
              Limpar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : pageItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-10 w-10" />
                Nenhuma justificativa encontrada com os filtros atuais.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data da falta</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.profiles?.name || '-'}</TableCell>
                      <TableCell>{d.title || d.type}</TableCell>
                      <TableCell>{formatDate(d.delivery_date)}</TableCell>
                      <TableCell>{formatDate(d.requested_at)}</TableCell>
                      <TableCell>{getStatusBadge(d.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewFile(d)} disabled={!d.file_path}>
                            <Eye className="h-3 w-3 mr-1" /> Ver doc
                          </Button>
                          {d.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(d)} disabled={busyId === d.id}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openReject(d)} disabled={busyId === d.id}>
                                <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>{p}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar justificativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo da rejeição (opcional)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Informe o motivo para o aluno..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={busyId === activeDecl?.id}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AbsenceJustifications;
