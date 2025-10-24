import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface ChangeOwnPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeOwnPasswordDialog({ open, onOpenChange }: ChangeOwnPasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Password validation requirements
  const requirements = [
    { label: 'Mínimo 8 caracteres', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Uma letra maiúscula', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Uma letra minúscula', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Um número', test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: 'Um caractere especial', test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  const isPasswordValid = requirements.every(req => req.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isDifferentFromCurrent = currentPassword !== newPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Todos os campos são obrigatórios"
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nova senha não atende aos requisitos de segurança"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem"
      });
      return;
    }

    if (!isDifferentFromCurrent) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nova senha deve ser diferente da senha atual"
      });
      return;
    }

    setLoading(true);
    try {
      // Obter sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Sessão expirada. Faça login novamente."
        });
        return;
      }

      // Chamar edge function com header de autorização
      const { data, error } = await supabase.functions.invoke('update-own-password', {
        body: {
          currentPassword,
          newPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error updating password:', error);
        
        // Tratar erro de sessão especificamente
        if (error.message?.includes('session') || error.message?.includes('Auth')) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Sessão expirada. Faça login novamente."
          });
          return;
        }
        
        // Handle specific error messages
        if (error.message.includes('incorreta') || error.message.includes('incorrect')) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Senha atual incorreta"
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error.message || "Erro ao alterar senha"
          });
        }
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Senha alterada com sucesso"
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);

    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao alterar senha"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha segura
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="space-y-1 mt-2">
                {requirements.map((req, index) => {
                  const isValid = req.test(newPassword);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {isValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <span className={isValid ? "text-green-600" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
                {newPassword && currentPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {isDifferentFromCurrent ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className={isDifferentFromCurrent ? "text-green-600" : "text-muted-foreground"}>
                      Diferente da senha atual
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Senhas coincidem</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-muted-foreground">Senhas não coincidem</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch || !isDifferentFromCurrent}
            >
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
