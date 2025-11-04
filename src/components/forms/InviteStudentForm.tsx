import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface InviteStudentFormProps {
  onSubmit: (email: string, name: string, classId?: string) => Promise<any>;
}

interface FormData {
  email: string;
  name: string;
  class_id?: string;
}

export const InviteStudentForm = ({ onSubmit }: InviteStudentFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const { data: classes, loading: loadingClasses } = useSupabaseClasses();
  
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormData>();

  const handleFormSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await onSubmit(data.email, data.name, data.class_id);
      if (result?.temporaryPassword) {
        setGeneratedPassword(result.temporaryPassword);
        setStudentEmail(data.email);
        setShowPassword(true);
        toast.success('Aluno criado com sucesso!');
      }
      setOpen(false);
      reset();
    } catch (error) {
      console.error('Error inviting student:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Senha copiada!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus size={16} />
          Convidar Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Novo Aluno</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome do aluno"
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...register('email', { 
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_id">Turma (Opcional)</Label>
            <Select onValueChange={(value) => setValue('class_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">ℹ️ Como funciona:</p>
            <p>• O aluno será criado com uma senha temporária fixa</p>
            <p>• Você receberá a senha para compartilhar com o aluno</p>
            <p>• O aluno deve trocar a senha no primeiro acesso</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog open={showPassword} onOpenChange={setShowPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Aluno criado com sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                O aluno foi cadastrado com sucesso. Compartilhe as informações de acesso:
              </p>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Email:</Label>
                  <p className="font-mono text-sm">{studentEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Senha Temporária:</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold">{generatedPassword}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-600">
                ⚠️ Importante: Copie e compartilhe essas informações com o aluno. O aluno deve trocar a senha no primeiro acesso.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowPassword(false)}>
              Entendi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};