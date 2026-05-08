import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Phone, Calendar, Mail, Key, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')).refine(
    (v) => !v || new Date(v) <= new Date(),
    { message: 'Data de nascimento não pode ser futura' }
  ),
  email: z.string().trim().email('E-mail inválido').max(255),
});

type FormData = z.infer<typeof schema>;

interface MyProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MyProfileSettingsDialog: React.FC<MyProfileSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (profile as any)?.avatar || (profile as any)?.photo || null
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', birth_date: '', email: '' },
  });

  useEffect(() => {
    if (open && profile && user) {
      form.reset({
        phone: (profile as any).phone || '',
        birth_date: (profile as any).birth_date || '',
        email: user.email || (profile as any).email || '',
      });
      setAvatarUrl((profile as any).avatar || (profile as any).photo || null);
    }
  }, [open, profile, user, form]);

  const formatPhone = (value: string) =>
    value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');

  const handleAvatarChange = async (newUrl: string | null) => {
    if (!profile?.id) return;
    setAvatarUrl(newUrl);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar: newUrl, photo: newUrl })
      .eq('id', profile.id);
    if (error) {
      toast.error('Erro ao salvar foto no perfil');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!profile?.id || !user) return;
    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: data.phone || null,
          birth_date: data.birth_date || null,
        })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      const newEmail = data.email.trim().toLowerCase();
      const currentEmail = (user.email || '').toLowerCase();
      let emailChangeRequested = false;

      if (newEmail && newEmail !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        emailChangeRequested = true;
      }

      toast.success(
        emailChangeRequested
          ? 'Dados atualizados! Confirme o novo e-mail na sua caixa de entrada para concluir a troca.'
          : 'Dados atualizados com sucesso!'
      );
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      toast.error(err?.message || 'Erro ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const userName = profile?.name || user?.email || 'Usuário';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Minhas Configurações
            </DialogTitle>
            <DialogDescription>
              Atualize sua foto, telefone, data de nascimento e e-mail.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Foto */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Foto de Perfil
                  </h3>
                  {profile?.id ? (
                    <AvatarUpload
                      currentAvatar={avatarUrl || undefined}
                      userId={profile.id}
                      userName={userName}
                      onAvatarChange={handleAvatarChange}
                      size="md"
                    />
                  ) : null}
                </CardContent>
              </Card>

              {/* Telefone */}
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Data de Nascimento */}
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Data de Nascimento
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* E-mail */}
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Ao trocar o e-mail, você receberá um link de confirmação no novo endereço.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    Segurança
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsChangePasswordOpen(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ChangeOwnPasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </>
  );
};
