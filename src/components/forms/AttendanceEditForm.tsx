import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, X } from "lucide-react";
import { Attendance } from "@/hooks/useSupabaseAttendance";
import { useForm } from "react-hook-form";

interface AttendanceEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance | null;
  onSave: (id: string, updates: Partial<Attendance>) => Promise<void>;
}

interface FormData {
  is_present: boolean;
  justification: string;
  date: string;
}

export function AttendanceEditForm({ open, onOpenChange, attendance, onSave }: AttendanceEditFormProps) {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      is_present: attendance?.is_present || false,
      justification: attendance?.justification || '',
      date: attendance?.date || new Date().toISOString().split('T')[0]
    }
  });

  const isPresent = watch('is_present');

  const onSubmit = async (data: FormData) => {
    if (!attendance) return;
    
    setLoading(true);
    try {
      await onSave(attendance.id, {
        is_present: data.is_present,
        justification: data.is_present ? null : (data.justification || 'Falta não justificada'),
        date: data.date
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Erro ao atualizar frequência:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!attendance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Frequência</DialogTitle>
          <DialogDescription>
            Alterar o registro de frequência do aluno {attendance.student_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { required: true })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status de Presença</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPresent}
                  onCheckedChange={(checked) => setValue('is_present', checked)}
                />
                <span className="text-sm">
                  {isPresent ? 'Presente' : 'Falta'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Informações do Registro</Label>
            <div className="p-3 bg-muted rounded-md space-y-1">
              <div className="text-sm"><strong>Aluno:</strong> {attendance.student_name}</div>
              <div className="text-sm"><strong>Turma:</strong> {attendance.class_name}</div>
              <div className="text-sm"><strong>Disciplina:</strong> {attendance.subject_name}</div>
            </div>
          </div>
          
          {!isPresent && (
            <div className="space-y-2">
              <Label htmlFor="justification">Justificativa da Falta</Label>
              <Textarea
                id="justification"
                placeholder="Digite a justificativa da falta (opcional)"
                {...register('justification')}
                rows={3}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={16} className="mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}