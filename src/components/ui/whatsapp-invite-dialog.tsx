import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedStudents, SelectedStudent } from '@/hooks/useSelectedStudents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, ExternalLink, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: SelectedStudent[];
}

interface SendResult {
  id: string;
  name: string;
  status: string;
  error?: string;
}

const PUBLISHED_URL = 'https://inovaclass2000.lovable.app';

const DEFAULT_TEMPLATE = `Olá {nome}! 🎓

Parabéns! Você foi selecionado(a) para o nosso curso!

Para confirmar sua pré-matrícula, acesse o link abaixo e preencha seus dados:

{link}

⚠️ Este link é pessoal e intransferível. Válido por 48 horas.

Equipe Inova Class`;

export const WhatsAppInviteDialog = ({ open, onOpenChange, students }: Props) => {
  const { generateTokens } = useSelectedStudents();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [readyStudents, setReadyStudents] = useState<SelectedStudent[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [mode, setMode] = useState<'choose' | 'manual' | 'auto'>('choose');
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);

  const handleGenerateTokens = async () => {
    setProcessing(true);
    try {
      const ids = students.map(s => s.id);
      const updated = await generateTokens.mutateAsync(ids);
      setReadyStudents(updated);
      setMode('manual');
      toast({ title: 'Tokens gerados! Envie os convites abaixo.' });
    } catch {
      toast({ title: 'Erro ao gerar tokens', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoSend = async () => {
    setSending(true);
    setSendResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-invites', {
        body: { student_ids: students.map(s => s.id) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSendResults(data.details || []);
      queryClient.invalidateQueries({ queryKey: ['selected-students'] });

      const sent = data.sent || 0;
      const failed = data.failed || 0;
      toast({
        title: `Envio concluído: ${sent} enviado(s), ${failed} falha(s)`,
        variant: failed > 0 ? 'destructive' : 'default',
      });
    } catch (err: any) {
      toast({ title: 'Erro no envio automático', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const openWhatsApp = (student: SelectedStudent) => {
    const phone = student.phone.replace(/\D/g, '');
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    const link = `${PUBLISHED_URL}/confirm-enrollment/${student.invite_token}`;
    const message = encodeURIComponent(
      `Olá ${student.full_name}! 🎓\n\n` +
      `Parabéns! Você foi selecionado(a) para o nosso curso!\n\n` +
      `Para confirmar sua pré-matrícula, acesse o link abaixo e preencha seus dados:\n\n` +
      `${link}\n\n` +
      `⚠️ Este link é pessoal e intransferível. Válido por 48 horas.\n\n` +
      `Equipe Inova Class`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handleClose = () => {
    onOpenChange(false);
    setReadyStudents([]);
    setSendResults(null);
    setMode('choose');
    setSending(false);
  };

  const sentCount = sendResults?.filter(r => r.status === 'sent').length || 0;
  const failedCount = sendResults?.filter(r => r.status === 'failed').length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar Convite via WhatsApp
          </DialogTitle>
          <DialogDescription>
            {students.length} aluno(s) selecionado(s) para envio.
          </DialogDescription>
        </DialogHeader>

        {/* Mode selection */}
        {mode === 'choose' && !sending && !sendResults && (
          <div className="space-y-3">
            <Button className="w-full justify-start gap-2" onClick={handleAutoSend}>
              <Send className="h-4 w-4" />
              Enviar para Todos Automaticamente
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleGenerateTokens} disabled={processing}>
              <ExternalLink className="h-4 w-4" />
              {processing ? 'Gerando tokens...' : 'Enviar Manualmente (wa.me)'}
            </Button>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {students.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 rounded bg-muted text-sm">
                  <span className="font-medium">{s.full_name}</span>
                  <span className="text-muted-foreground">{s.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sending progress */}
        {sending && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando mensagens para {students.length} aluno(s)...
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Results */}
        {sendResults && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" /> {sentCount} enviado(s)
              </span>
              {failedCount > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" /> {failedCount} falha(s)
                </span>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {sendResults.map(r => (
                <div key={r.id} className="flex justify-between items-center p-2 rounded bg-muted text-sm">
                  <span className="font-medium">{r.name}</span>
                  {r.status === 'sent' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="flex items-center gap-1 text-destructive text-xs">
                      <XCircle className="h-3 w-3" /> {r.error || 'Falhou'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual mode */}
        {mode === 'manual' && readyStudents.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {readyStudents.map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 rounded bg-muted">
                <span className="text-sm font-medium">{s.full_name}</span>
                <Button size="sm" variant="outline" onClick={() => openWhatsApp(s)}>
                  <ExternalLink className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
