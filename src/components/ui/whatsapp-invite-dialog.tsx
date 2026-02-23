import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSelectedStudents, SelectedStudent } from '@/hooks/useSelectedStudents';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: SelectedStudent[];
}

const PUBLISHED_URL = 'https://inovaclass2000.lovable.app';

export const WhatsAppInviteDialog = ({ open, onOpenChange, students }: Props) => {
  const { generateTokens } = useSelectedStudents();
  const [processing, setProcessing] = useState(false);
  const [readyStudents, setReadyStudents] = useState<SelectedStudent[]>([]);

  const handleGenerateTokens = async () => {
    setProcessing(true);
    try {
      const ids = students.map(s => s.id);
      const updated = await generateTokens.mutateAsync(ids);
      setReadyStudents(updated);
      toast({ title: 'Tokens gerados! Envie os convites abaixo.' });
    } catch {
      toast({ title: 'Erro ao gerar tokens', variant: 'destructive' });
    } finally {
      setProcessing(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Enviar Convite via WhatsApp
          </DialogTitle>
          <DialogDescription>
            {readyStudents.length === 0
              ? `${students.length} aluno(s) selecionado(s). Gere os tokens primeiro.`
              : 'Clique no botão de cada aluno para abrir o WhatsApp.'}
          </DialogDescription>
        </DialogHeader>

        {readyStudents.length === 0 ? (
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 rounded bg-muted">
                <span className="text-sm font-medium">{s.full_name}</span>
                <span className="text-xs text-muted-foreground">{s.phone}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {readyStudents.map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 rounded bg-muted">
                <span className="text-sm font-medium">{s.full_name}</span>
                <Button size="sm" variant="outline" onClick={() => openWhatsApp(s)} className="text-green-600">
                  <ExternalLink className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setReadyStudents([]); }}>Fechar</Button>
          {readyStudents.length === 0 && (
            <Button onClick={handleGenerateTokens} disabled={processing}>
              {processing ? 'Gerando...' : 'Gerar Tokens e Preparar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
