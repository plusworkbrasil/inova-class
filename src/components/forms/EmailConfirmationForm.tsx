import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Users } from 'lucide-react';

export const EmailConfirmationForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { toast } = useToast();

  const confirmSingleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('confirm-user-email', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      toast({
        title: "Email confirmado!",
        description: `O email ${email} foi confirmado com sucesso.`
      });

      setEmail('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar email",
        description: error.message || "Erro inesperado ao confirmar email."
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmAllEmails = async () => {
    setBulkLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('confirm-user-email', {
        body: { bulkConfirm: true }
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const totalCount = data.results?.length || 0;

      toast({
        title: "Confirmação em massa concluída!",
        description: `${successCount} de ${totalCount} emails foram confirmados com sucesso.`
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na confirmação em massa",
        description: error.message || "Erro inesperado ao confirmar emails."
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Confirmar Email Individual
          </CardTitle>
          <CardDescription>
            Confirme o email de um usuário específico para permitir o login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={confirmSingleEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Confirmação em Massa
          </CardTitle>
          <CardDescription>
            Confirme todos os emails não confirmados de uma só vez (útil para desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={confirmAllEmails} 
            disabled={bulkLoading}
            variant="outline"
            className="w-full"
          >
            {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Todos os Emails Pendentes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};