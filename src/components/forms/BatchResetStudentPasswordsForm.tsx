import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const BatchResetStudentPasswordsForm = () => {
  const [loading, setLoading] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchStudentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      if (error) throw error;
      setStudentCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching student count:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar o número de alunos.',
      });
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchStudentCount();
    }
  };

  const handleResetPasswords = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('batch-reset-student-passwords', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: data.message,
        });
        setOpen(false);
      } else {
        throw new Error(data.error || 'Erro ao redefinir senhas');
      }
    } catch (error: any) {
      console.error('Error resetting passwords:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senhas dos alunos.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Esta ação irá redefinir as senhas de todos os alunos para uma senha padrão. Os alunos poderão alterar suas senhas após o próximo login.
        </AlertDescription>
      </Alert>

      <AlertDialog open={open} onOpenChange={handleOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full flex items-center gap-2">
            <Shield size={16} />
            Redefinir Senhas de Todos os Alunos
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Redefinição em Lote
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                Esta ação irá redefinir as senhas de {studentCount !== null ? studentCount : '...'} aluno(s).
              </p>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-sm">
                  <strong>Nova senha padrão:</strong> <code className="bg-background px-2 py-1 rounded">J@V3mTech</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Os alunos poderão alterar suas senhas após o login usando a funcionalidade "Alterar Senha" disponível no menu do perfil.
                </p>
              </div>
              <p className="text-destructive text-sm font-medium">
                ⚠️ Esta ação não pode ser desfeita. Certifique-se de informar os alunos sobre a nova senha.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetPasswords();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Confirmar Redefinição'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
