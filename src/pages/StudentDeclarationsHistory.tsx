import { useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, FileText, Clock, CheckCircle, XCircle, Download, Eye, Paperclip,
} from 'lucide-react';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseDeclarations, type Declaration } from '@/hooks/useSupabaseDeclarations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const typeLabel = (t?: string | null) => {
  switch (t) {
    case 'atestado_medico': return 'Atestado médico';
    case 'atestado_trabalho': return 'Atestado de trabalho';
    case 'outros': return 'Outros';
    case 'medical_certificate': return 'Atestado médico';
    case 'enrollment_certificate': return 'Declaração de matrícula';
    default: return t || '—';
  }
};

const statusBadge = (status?: string) => {
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

const StudentDeclarationsHistory = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const userRole = (profile?.role || 'student') as UserRole;
  const userName = profile?.name || profile?.email || 'Aluno';

  const { data: declarations, loading } = useSupabaseDeclarations();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Declaration | null>(null);

  const filtered = useMemo(() => {
    return declarations.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const haystack = `${d.title || ''} ${d.description || ''} ${d.purpose || ''} ${typeLabel(d.type)}`.toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [declarations, statusFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: declarations.length,
    pending: declarations.filter(d => d.status === 'pending').length,
    approved: declarations.filter(d => d.status === 'approved').length,
    rejected: declarations.filter(d => d.status === 'rejected').length,
  }), [declarations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('declarations')
        .createSignedUrl(filePath, 60);
      if (error || !data?.signedUrl) throw error || new Error('Sem URL');
      window.open(data.signedUrl, '_blank');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível abrir o anexo',
        description: e?.message || 'Tente novamente em instantes.',
      });
    }
  };

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Histórico de Declarações</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe as declarações e justificativas que você enviou, com status, datas e anexos.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <FileText className="h-7 w-7 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-7 w-7 text-warning" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
              </div>
              <CheckCircle className="h-7 w-7 text-success" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Rejeitadas</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <XCircle className="h-7 w-7 text-destructive" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, motivo ou descrição..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="md:w-56">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
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
          <CardHeader>
            <CardTitle className="text-base">Minhas declarações enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : pageItems.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhuma declaração encontrada.
              </div>
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
                    {pageItems.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm">{typeLabel(d.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[260px] truncate">
                          {d.title || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(d.requested_at || d.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(d.processed_at)}
                        </TableCell>
                        <TableCell>{statusBadge(d.status)}</TableCell>
                        <TableCell>
                          {d.file_path ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDownload(d.file_path!)}
                            >
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setDetail(d)}
                          >
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

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i + 1}
                          onClick={() => setPage(i + 1)}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da declaração</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação enviada.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {statusBadge(detail.status)}
              </div>
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">{typeLabel(detail.type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Título</p>
                <p className="font-medium">{detail.title || '—'}</p>
              </div>
              {detail.purpose && (
                <div>
                  <p className="text-muted-foreground">Finalidade / Data da falta</p>
                  <p className="font-medium whitespace-pre-wrap">{detail.purpose}</p>
                </div>
              )}
              {detail.description && (
                <div>
                  <p className="text-muted-foreground">Descrição</p>
                  <p className="whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}
              {detail.observations && (
                <div>
                  <p className="text-muted-foreground">Observações da secretaria</p>
                  <p className="whitespace-pre-wrap">{detail.observations}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Enviada em</p>
                  <p>{formatDateTime(detail.requested_at || detail.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processada em</p>
                  <p>{formatDateTime(detail.processed_at)}</p>
                </div>
              </div>
              {detail.delivery_date && (
                <div>
                  <p className="text-muted-foreground">Data de entrega</p>
                  <p>{formatDate(detail.delivery_date)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Anexo</p>
                {detail.file_path ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(detail.file_path!)}
                  >
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
};

export default StudentDeclarationsHistory;
