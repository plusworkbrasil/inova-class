import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading: authLoading } = useAuth();
  const { enabled: maintenanceEnabled } = useMaintenanceMode();
  
  // Detectar motivo do redirecionamento
  const redirectReason = (location.state as any)?.reason;
  const fromPath = (location.state as any)?.from;

  useEffect(() => {
    // Só redireciona se o usuário estiver autenticado E não estiver carregando
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Error handling is already done in useAuth
    } finally {
      setLoading(false);
    }
  };

  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Informe o email.');
      return;
    }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: forgotEmail },
      });

      if (error) {
        toast.error('Erro ao solicitar redefinição de senha.');
        return;
      }

      toast.success('Se o email estiver cadastrado, você receberá um link para redefinir sua senha via WhatsApp e/ou e-mail.');
      setShowForgotDialog(false);
    } catch {
      toast.error('Erro ao solicitar redefinição de senha.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Entrar
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Entre com suas credenciais
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {maintenanceEnabled && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Sistema temporariamente indisponível. Procure o administrador do sistema.
              </AlertDescription>
            </Alert>
          )}
          {redirectReason === 'session_expired' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sua sessão expirou. Faça login novamente para continuar.
                {fromPath && ` Você será redirecionado para ${fromPath}.`}
              </AlertDescription>
            </Alert>
          )}
          {redirectReason === 'not_authenticated' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa estar autenticado para acessar esta página.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-10 px-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : 'Entrar'}
            </Button>

            <div className="text-center mt-2">
              <Button
                type="button"
                variant="link"
                className="text-xs"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotDialog(true);
                }}
              >
                Esqueci a minha senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esqueci a minha senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe seu email cadastrado. Enviaremos um link para redefinir sua senha por WhatsApp (se houver telefone) e, como alternativa, por e-mail.
            </p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForgotDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail}>
              {forgotLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;