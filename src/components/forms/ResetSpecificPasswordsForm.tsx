import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const USERS_TO_RESET = [
  '4nna.menezes@gmail.com',
  'jejejessicamaria@gmail.com',
  'annelais002@gmail.com',
  'beatrizsouza85596@gmail.com'
];

export function ResetSpecificPasswordsForm() {
  const [loading, setLoading] = useState(false);

  const handleResetPasswords = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('reset-specific-passwords', {
        body: { emails: USERS_TO_RESET },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        if (data.results.errors.length > 0) {
          console.error('Erros durante o reset:', data.results.errors);
        }
      } else {
        toast.error(data.error || 'Erro ao redefinir senhas');
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senhas:', error);
      toast.error(error.message || 'Erro ao redefinir senhas dos usuários');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta ação irá redefinir as senhas dos seguintes usuários para <strong>J@V3mTech</strong>:
          <ul className="list-disc list-inside mt-2 space-y-1">
            {USERS_TO_RESET.map(email => (
              <li key={email} className="text-sm">{email}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleResetPasswords}
        disabled={loading}
        variant="destructive"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redefinindo senhas...
          </>
        ) : (
          'Redefinir Senhas dos 4 Usuários'
        )}
      </Button>
    </div>
  );
}
