import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2, GraduationCap, XCircle } from 'lucide-react';

interface StudentData {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone: string;
  shift: string | null;
  course_name: string | null;
}

const ConfirmEnrollment = () => {
  const { token } = useParams<{ token: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shift, setShift] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  useEffect(() => {
    if (!token) { setError('Link inválido'); setLoading(false); return; }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-enrollment?token=${token}`;
      const res = await fetch(url, {
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Erro ao carregar dados');
      } else {
        setStudent(result);
        if (result.shift) setShift(result.shift);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!shift) return;
    setConfirming(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-enrollment?token=${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ confirmed_shift: shift }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Erro ao confirmar');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setConfirming(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawReason.trim().length < 5) return;
    setWithdrawing(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-enrollment?token=${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: 'withdraw', withdrawal_reason: withdrawReason.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Erro ao registrar desistência');
      } else {
        setWithdrawn(true);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Inscrição Confirmada!</CardTitle>
            <CardDescription>
              Sua pré-matrícula foi confirmada com sucesso. Você receberá mais informações em breve.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (withdrawn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Desistência Registrada</CardTitle>
            <CardDescription>
              Sua desistência foi registrada com sucesso. Caso mude de ideia, entre em contato com a instituição.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Ops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-2" />
          {student?.course_name && (
            <Badge variant="secondary" className="mx-auto text-sm px-4 py-1 mb-2">
              {student.course_name}
            </Badge>
          )}
          <CardTitle className="text-xl">Confirmação de Pré-Matrícula</CardTitle>
          <CardDescription>Confirme seus dados e selecione o turno desejado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">Nome</Label>
            <p className="font-medium">{student?.full_name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">E-mail</Label>
            <p className="font-medium">{student?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">CPF</Label>
            <p className="font-medium">{student?.cpf}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Telefone</Label>
            <p className="font-medium">{student?.phone}</p>
          </div>

          {!showWithdraw ? (
            <>
              <div className="space-y-2">
                <Label>Turno desejado *</Label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleConfirm} disabled={!shift || confirming}>
                {confirming ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando...</> : 'Confirmar Pré-Matrícula'}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>
              <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => setShowWithdraw(true)}>
                Desistir do Curso
              </Button>
            </>
          ) : (
            <div className="space-y-3 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
              <p className="text-sm font-medium text-destructive">Tem certeza que deseja desistir?</p>
              <div className="space-y-2">
                <Label>Motivo da desistência *</Label>
                <Textarea
                  placeholder="Informe o motivo (mínimo 5 caracteres)..."
                  value={withdrawReason}
                  onChange={e => setWithdrawReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowWithdraw(false); setWithdrawReason(''); }}>
                  Voltar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleWithdraw} disabled={withdrawReason.trim().length < 5 || withdrawing}>
                  {withdrawing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Confirmar Desistência'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEnrollment;
