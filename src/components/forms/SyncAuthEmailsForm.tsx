import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

const USERS_TO_SYNC = [
  '4nna.menezes@gmail.com',
  'jejejessicamaria@gmail.com',
  'annelais002@gmail.com',
  'beatrizsouza85596@gmail.com'
];

export function SyncAuthEmailsForm() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-auth-email-with-profiles', {
        body: { emails: USERS_TO_SYNC }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        
        if (data.results.errors && data.results.errors.length > 0) {
          console.error('Erros na sincronização:', data.results.errors);
          toast.error(`Alguns erros ocorreram: ${data.results.errors.join(', ')}`);
        }
      } else {
        throw new Error(data.error || 'Erro ao sincronizar emails');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar emails: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ ATENÇÃO:</strong> Esta operação irá <strong>sobrescrever</strong> os emails no sistema de 
          autenticação (<code className="font-mono">auth.users</code>) com os emails da tabela 
          <code className="font-mono"> profiles</code>.
          <br /><br />
          Dependendo das configurações do Supabase, isso pode:
          <ul className="list-disc ml-5 mt-2">
            <li>Disparar emails de confirmação para os usuários</li>
            <li>Exigir que os usuários confirmem o novo email antes de fazer login</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert>
        <RefreshCw className="h-4 w-4" />
        <AlertDescription>
          <strong>Usuários que serão sincronizados:</strong>
          <ul className="list-disc ml-5 mt-2">
            {USERS_TO_SYNC.map(email => (
              <li key={email} className="font-mono text-sm">{email}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <div className="bg-muted p-4 rounded-md text-sm space-y-2">
        <p className="font-semibold">Recomendações:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Execute o <strong>Diagnóstico</strong> primeiro para confirmar a desincronização</li>
          <li>Execute o <strong>Reset de Senhas</strong> antes desta sincronização (garante acesso imediato)</li>
          <li>Após sincronizar, os usuários devem fazer login com o email da tabela profiles + senha resetada</li>
          <li>Se houver confirmação de email, aguarde os usuários confirmarem antes de testar</li>
        </ol>
      </div>

      <Button 
        onClick={handleSync}
        disabled={loading}
        variant="destructive"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar Emails dos 4 Usuários
          </>
        )}
      </Button>
    </div>
  );
}
