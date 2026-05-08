import { useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CalendarDays, CheckCircle2, XCircle, Percent, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const MyAttendance = () => {
  const { profile, user } = useAuth();
  const { data: attendance, loading } = useSupabaseAttendance();
  const { data: subjects } = useSupabaseSubjects();

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  // Defensivo: somente próprias frequências
  const myRecords = useMemo(
    () => (attendance || []).filter((a) => a.student_id === user?.id),
    [attendance, user?.id]
  );

  const filtered = useMemo(() => {
    return myRecords.filter((r) => {
      if (subjectFilter !== 'all' && r.subject_id !== subjectFilter) return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }, [myRecords, subjectFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => r.is_present).length;
    const absent = total - present;
    const pct = total > 0 ? (present / total) * 100 : 0;
    return { total, present, absent, pct };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const lowAttendance = stats.total > 0 && stats.pct < 75;

  const clearFilters = () => {
    setSubjectFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (!profile) return null;

  return (
    <Layout userRole={profile.role as any} userName={profile.name} userAvatar={profile.avatar}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Frequências</h1>
          <p className="text-muted-foreground mt-2">
            Visualize seu histórico de presenças e faltas. Mantenha sua frequência acima de 75%.
          </p>
        </div>

        {/* Cards-resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Aulas</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presenças</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faltas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card className={cn(lowAttendance && 'bg-red-50 dark:bg-red-950/30 border-destructive/40')}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">% Frequência</CardTitle>
              <Percent className={cn('h-4 w-4', lowAttendance ? 'text-destructive' : 'text-primary')} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', lowAttendance ? 'text-destructive' : '')}>
                {stats.pct.toFixed(1)}%
              </div>
              {lowAttendance && (
                <p className="text-xs text-destructive mt-1">Abaixo do mínimo de 75%</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(subjects || []).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data início</Label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-2">
              <Label>Data fim</Label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">Limpar filtros</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Histórico de Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro de frequência encontrado.
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Justificativa</TableHead>
                        <TableHead>Atividade do dia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageItems.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{formatDateBR(r.date)}</TableCell>
                          <TableCell>{r.subject_name || '-'}</TableCell>
                          <TableCell>
                            {r.is_present ? (
                              <Badge variant="outline" className="border-green-600 text-green-700 dark:text-green-400">
                                Presente
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Falta</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={r.justification || ''}>
                            {r.justification || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={r.daily_activity || ''}>
                            {r.daily_activity || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => { e.preventDefault(); setPage(Math.max(1, currentPage - 1)); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === currentPage}
                            onClick={(e) => { e.preventDefault(); setPage(p); }}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, currentPage + 1)); }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyAttendance;
