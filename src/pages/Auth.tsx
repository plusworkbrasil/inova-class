import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/dashboard');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Email já cadastrado",
            description: "Este email já está em uso. Tente fazer login ou use outro email.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar a conta.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos. Tente novamente.",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Ocorreu um erro ao fazer login.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para instruções de redefinição de senha.",
      });
      
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro ao enviar o email de redefinição.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isForgotPassword ? 'Redefinir Senha' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {isForgotPassword 
              ? 'Digite seu email para receber instruções de redefinição'
              : (isLogin ? 'Entre com suas credenciais' : 'Preencha os dados para criar sua conta')
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={isForgotPassword ? handleForgotPassword : (isLogin ? handleSignIn : handleSignUp)} className="space-y-4">
            {!isLogin && !isForgotPassword && (
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
            
            {!isForgotPassword && (
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
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : 
                (isForgotPassword ? 'Enviar Email' : 
                  (isLogin ? 'Entrar' : 'Criar Conta')
                )
              }
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            {!isForgotPassword && (
              <>
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm"
                >
                  {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
                </Button>
                
                {isLogin && (
                  <div>
                    <Button 
                      variant="link" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm"
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {isForgotPassword && (
              <Button 
                variant="link" 
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-sm"
              >
                Voltar ao login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;