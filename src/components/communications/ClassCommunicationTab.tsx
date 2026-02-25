import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Send,
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClassComm {
  id: string;
  class_id: string;
  subject_id: string | null;
  title: string;
  message: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  send_results: any[];
  created_at: string;
  classes?: { name: string };
  subjects?: { name: string } | null;
}

const ClassCommunicationTab = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; class_id: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<ClassComm[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeStudentCount, setActiveStudentCount] = useState<number | null>(null);

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      if (data) setClasses(data);
    };
    loadClasses();
    loadHistory();
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId('');
      setActiveStudentCount(null);
      return;
    }
    const loadSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .eq('class_id', selectedClassId)
        .order('name');
      if (data) setSubjects(data);
    };
    const loadStudentCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', selectedClassId)
        .eq('status', 'active');
      setActiveStudentCount(count);
    };
    loadSubjects();
    loadStudentCount();
  }, [selectedClassId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('class_communications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setHistory(data as ClassComm[]);
    setLoadingHistory(false);
  };

  const handleSend = async () => {
    if (!selectedClassId || !title.trim() || !message.trim()) {
      toast({ title: 'Erro', description: 'Selecione uma turma e preencha título e mensagem.', variant: 'destructive' });
      return;
    }
    if (message.length > 1000) {
      toast({ title: 'Erro', description: 'Mensagem excede 1.000 caracteres.', variant: 'destructive' });
      return;
    }

    let scheduledAt: string | null = null;
    if (isScheduled && scheduleDate) {
      const dt = new Date(scheduleDate);
      if (scheduleTime) {
        const [h, m] = scheduleTime.split(':');
        dt.setHours(parseInt(h), parseInt(m), 0, 0);
      }
      scheduledAt = dt.toISOString();
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-class-communication', {
        body: {
          class_id: selectedClassId,
          subject_id: selectedSubjectId || null,
          title: title.trim(),
          message: message.trim(),
          scheduled_at: scheduledAt,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const desc = scheduledAt
          ? `Comunicado agendado para ${format(new Date(scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}.`
          : `Enviado: ${data.sent}/${data.total}. ${data.failed > 0 ? `Falhou: ${data.failed}.` : ''} ${data.without_phone?.length > 0 ? `Sem telefone: ${data.without_phone.length}.` : ''}`;

        toast({ title: 'Comunicado enviado!', description: desc });
        setTitle('');
        setMessage('');
        setScheduleDate(undefined);
        setScheduleTime('');
        setIsScheduled(false);
        loadHistory();
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao enviar comunicado.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle size={12} className="mr-1" />Enviado</Badge>;
      case 'sending':
        return <Badge variant="secondary"><Clock size={12} className="mr-1" />Enviando</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500"><CalendarIcon size={12} className="mr-1" />Agendado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle size={12} className="mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Enviar Comunicado via WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Turma *</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClassId && (
              <div>
                <label className="text-sm font-medium">Disciplina (opcional)</label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Todas as disciplinas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeStudentCount !== null && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium">
                  {activeStudentCount} aluno(s) ativo(s) nesta turma
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                placeholder="Ex: Aviso sobre aula de amanhã"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mensagem * <span className="text-muted-foreground">({message.length}/1000)</span></label>
              <Textarea
                placeholder="Digite a mensagem. Use {nome} para personalizar com o nome do aluno."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variáveis: <code className="bg-muted px-1 rounded">{'{nome}'}</code> = nome do aluno
              </p>
            </div>

            {/* Schedule toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule-toggle"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="schedule-toggle" className="text-sm font-medium">Agendar envio</label>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">Horário</label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={isSending || !selectedClassId || !title.trim() || !message.trim()}
              className="w-full"
            >
              {isSending ? (
                <><Loader2 size={16} className="mr-2 animate-spin" />Enviando...</>
              ) : isScheduled ? (
                <><CalendarIcon size={16} className="mr-2" />Agendar Comunicado</>
              ) : (
                <><Send size={16} className="mr-2" />Enviar Agora</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20 min-h-[200px]">
              {title || message ? (
                <div className="space-y-2">
                  {title && <p className="font-bold text-foreground">{title}</p>}
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {message.replace(/\{nome\}/g, 'João Silva')}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center mt-10">
                  A pré-visualização aparecerá aqui...
                </p>
              )}
            </div>
            {selectedClassId && (
              <div className="mt-4 text-xs text-muted-foreground space-y-1">
                <p>• Apenas alunos ativos receberão o comunicado</p>
                <p>• Alunos evadidos são excluídos automaticamente</p>
                <p>• Alunos sem telefone cadastrado serão reportados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Comunicados por Turma</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loadingHistory}>
            <RefreshCw size={14} className={cn("mr-1", loadingHistory && "animate-spin")} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum comunicado enviado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(comm => (
                  <TableRow key={comm.id}>
                    <TableCell className="font-medium">{comm.title}</TableCell>
                    <TableCell>{getStatusBadge(comm.status)}</TableCell>
                    <TableCell>{comm.total_recipients}</TableCell>
                    <TableCell className="text-green-600 font-medium">{comm.sent_count}</TableCell>
                    <TableCell className="text-destructive font-medium">{comm.failed_count}</TableCell>
                    <TableCell>
                      {comm.sent_at
                        ? format(new Date(comm.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : comm.scheduled_at
                        ? `Agendado: ${format(new Date(comm.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
                        : format(new Date(comm.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassCommunicationTab;
