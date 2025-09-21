import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, login, register, loading: authLoading } = useAuth();

  useEffect(() => {
    // Só redireciona se o usuário estiver autenticado E não estiver carregando
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (error) {
      // Error handling is already done in useAuth
    } finally {
      setLoading(false);
    }
  };

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

  const createTestUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-user');
      
      if (error) {
        toast.error('Erro ao criar usuário de teste: ' + (error.message || ''));
      } else {
        toast.success('Usuário de teste pronto! Fazendo login...');
        try {
          await login('admin@escola.com', 'admin123');
          navigate('/dashboard');
        } catch (e) {
          // Se ainda falhar, apenas informa para tentar manualmente
          toast.error('Falha ao logar automaticamente. Tente: admin@escola.com / admin123');
        }
      }
    } catch (error) {
      toast.error('Erro ao criar usuário de teste');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email) {
      toast.error('Informe o email para reenviar a confirmação.');
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) {
        toast.error('Erro ao reenviar e-mail: ' + (error.message || ''));
      } else {
        toast.success('E-mail de confirmação reenviado! Verifique sua caixa de entrada. Pode levar alguns minutos para chegar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {isLogin ? 'Entre com suas credenciais' : 'Preencha os dados para criar sua conta'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
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
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>

            {isLogin && (
              <div className="text-center mt-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-xs"
                  onClick={resendConfirmation}
                  disabled={loading || !email}
                >
                  Reenviar e-mail de confirmação
                </Button>
              </div>
            )}
          </form>
          
          <div className="mt-4 text-center space-y-2">
            <Button 
              variant="link" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
            </Button>
          </div>

          {/* Credenciais de teste para facilitar */}
          <div className="mt-4 p-3 bg-muted rounded text-sm">
            <p className="font-medium">Credenciais de teste:</p>
            <p>Email: admin@escola.com</p>
            <p>Senha: admin123</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={createTestUser}
              disabled={loading}
            >
              Criar usuário de teste
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;