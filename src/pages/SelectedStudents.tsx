import { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, MessageSquare, UserPlus, Trash2, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { SelectedStudentForm } from '@/components/forms/SelectedStudentForm';
import { BatchSelectedStudentsForm } from '@/components/forms/BatchSelectedStudentsForm';
import { WhatsAppInviteDialog } from '@/components/ui/whatsapp-invite-dialog';
import { AssignClassDialog } from '@/components/ui/assign-class-dialog';
import { useSelectedStudents, SelectedStudent } from '@/hooks/useSelectedStudents';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { format } from 'date-fns';

const shiftLabel: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const statusLabel: Record<string, string> = { pending: 'Pendente', invited: 'Convidado', confirmed: 'Confirmado', enrolled: 'Matriculado', withdrawn: 'Desistente' };
const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary', invited: 'outline', confirmed: 'default', enrolled: 'default', withdrawn: 'destructive',
};

function filterStudents(
  list: SelectedStudent[],
  { search, courseFilter, shiftFilter, whatsappFilter }: { search: string; courseFilter: string; shiftFilter: string; whatsappFilter?: string }
) {
  let result = list;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.cpf && s.cpf.includes(q))
    );
  }
  if (courseFilter !== 'all') {
    result = result.filter(s => s.course_name === courseFilter);
  }
  if (shiftFilter !== 'all') {
    result = result.filter(s => (s.confirmed_shift || s.shift || '') === shiftFilter);
  }
  if (whatsappFilter && whatsappFilter !== 'all') {
    result = result.filter(s => {
      if (whatsappFilter === 'pending') return !s.whatsapp_status;
      return s.whatsapp_status === (whatsappFilter === 'sent' ? 'sent' : whatsappFilter === 'failed' ? 'failed' : s.whatsapp_status);
    });
  }
  return result;
}

const SelectedStudents = () => {
  const { students, isLoading, pending, confirmed, enrolled, withdrawn, deleteStudent } = useSelectedStudents();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [whatsappFilter, setWhatsappFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const courses = useMemo(() =>
    [...new Set(students.map(s => s.course_name).filter(Boolean))] as string[],
    [students]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (list: SelectedStudent[]) => {
    const allSelected = list.every(s => selectedIds.has(s.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      list.forEach(s => allSelected ? next.delete(s.id) : next.add(s.id));
      return next;
    });
  };

  const selectedStudents = students.filter(s => selectedIds.has(s.id));

  const filters = { search, courseFilter, shiftFilter };
  const filteredPending = useMemo(() => filterStudents(pending, { ...filters, whatsappFilter }), [pending, search, courseFilter, shiftFilter, whatsappFilter]);
  const filteredConfirmed = useMemo(() => filterStudents(confirmed, { ...filters, whatsappFilter }), [confirmed, search, courseFilter, shiftFilter, whatsappFilter]);
  const filteredEnrolled = useMemo(() => filterStudents(enrolled, filters), [enrolled, search, courseFilter, shiftFilter]);
  const filteredWithdrawn = useMemo(() => filterStudents(withdrawn, filters), [withdrawn, search, courseFilter, shiftFilter]);

  const renderFilters = (showWhatsapp: boolean, extraButtons?: React.ReactNode) => (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar nome, email, telefone, CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={shiftFilter} onValueChange={setShiftFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os turnos</SelectItem>
          <SelectItem value="manha">Manhã</SelectItem>
          <SelectItem value="tarde">Tarde</SelectItem>
          <SelectItem value="noite">Noite</SelectItem>
        </SelectContent>
      </Select>
      {showWhatsapp && (
        <Select value={whatsappFilter} onValueChange={setWhatsappFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">WhatsApp: Todos</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      )}
      {extraButtons}
    </div>
  );

  const renderTable = (list: SelectedStudent[], showCheckbox = false, showActions = false, showWithdrawalInfo = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckbox && (
            <TableHead className="w-10">
              <Checkbox checked={list.length > 0 && list.every(s => selectedIds.has(s.id))} onCheckedChange={() => toggleAll(list)} />
            </TableHead>
          )}
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Curso</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead>Status</TableHead>
          {!showWithdrawalInfo && <TableHead className="w-20">WhatsApp</TableHead>}
          {showWithdrawalInfo && <TableHead>Motivo</TableHead>}
          {showWithdrawalInfo && <TableHead>Data</TableHead>}
          {showActions && <TableHead className="w-10"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow><TableCell colSpan={showCheckbox ? 11 : 10} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
        ) : list.map(s => (
          <TableRow key={s.id}>
            {showCheckbox && (
              <TableCell><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></TableCell>
            )}
            <TableCell className="font-medium">{s.full_name}</TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>{s.phone}</TableCell>
            <TableCell>{s.cpf}</TableCell>
            <TableCell>{s.course_name || <span className="text-muted-foreground text-xs">—</span>}</TableCell>
            <TableCell>{shiftLabel[s.confirmed_shift || s.shift || ''] || '-'}</TableCell>
            <TableCell><Badge variant={statusVariant[s.status]}>{statusLabel[s.status] || s.status}</Badge></TableCell>
            {!showWithdrawalInfo && (
              <TableCell className="text-center">
                {s.whatsapp_status === 'sent' && <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}
                {s.whatsapp_status === 'failed' && <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                {s.whatsapp_status === 'sending' && <Clock className="h-4 w-4 text-muted-foreground mx-auto animate-pulse" />}
                {!s.whatsapp_status && <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
            )}
            {showWithdrawalInfo && (
              <>
                <TableCell className="max-w-[200px] truncate text-sm" title={s.withdrawal_reason || ''}>{s.withdrawal_reason || '—'}</TableCell>
                <TableCell className="text-sm">{s.withdrawn_at ? format(new Date(s.withdrawn_at), 'dd/MM/yyyy') : '—'}</TableCell>
              </>
            )}
            {showActions && (
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Selecionados</h1>
          <p className="text-muted-foreground">Gerenciamento de pré-matrícula de alunos selecionados</p>
        </div>

        <Tabs defaultValue="selected" onValueChange={() => setSelectedIds(new Set())}>
          <TabsList>
            <TabsTrigger value="selected">Selecionados ({pending.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmados ({confirmed.length})</TabsTrigger>
            <TabsTrigger value="enrolled">Matriculados ({enrolled.length})</TabsTrigger>
            <TabsTrigger value="withdrawn">Desistentes ({withdrawn.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="selected" className="space-y-4">
            {renderFilters(true, (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Cadastrar</Button>
                <Button variant="outline" onClick={() => setShowBatch(true)}><Upload className="h-4 w-4 mr-1" /> Lote</Button>
                <Button
                  variant="outline"
                  disabled={selectedStudents.filter(s => s.status === 'pending' || s.status === 'invited').length === 0}
                  onClick={() => setShowWhatsApp(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> WhatsApp ({selectedStudents.filter(s => s.status === 'pending' || s.status === 'invited').length})
                </Button>
              </div>
            ))}
            {renderTable(filteredPending, true, true)}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {renderFilters(true, (
              <Button
                disabled={selectedStudents.filter(s => s.status === 'confirmed').length === 0}
                onClick={() => setShowAssign(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" /> Atribuir a Turma ({selectedStudents.filter(s => s.status === 'confirmed').length})
              </Button>
            ))}
            {renderTable(filteredConfirmed, true, false)}
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-4">
            {renderFilters(false)}
            {renderTable(filteredEnrolled, false, false)}
          </TabsContent>

          <TabsContent value="withdrawn" className="space-y-4">
            {renderFilters(false)}
            {renderTable(filteredWithdrawn, false, true, true)}
          </TabsContent>
        </Tabs>
      </div>

      <SelectedStudentForm open={showForm} onOpenChange={setShowForm} />
      <BatchSelectedStudentsForm open={showBatch} onOpenChange={setShowBatch} />
      <WhatsAppInviteDialog
        open={showWhatsApp}
        onOpenChange={setShowWhatsApp}
        students={selectedStudents.filter(s => s.status === 'pending' || s.status === 'invited')}
      />
      <AssignClassDialog
        open={showAssign}
        onOpenChange={setShowAssign}
        students={selectedStudents.filter(s => s.status === 'confirmed')}
      />
      <DeleteConfirmation
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteStudent.mutate(deleteId); setDeleteId(null); } }}
        title="Remover Selecionado"
        description="Tem certeza que deseja remover este aluno da lista de selecionados?"
      />
    </Layout>
  );
};

export default SelectedStudents;
