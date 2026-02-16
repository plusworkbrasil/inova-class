import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Book, CheckCircle, XCircle } from "lucide-react";
import { Attendance } from "@/hooks/useSupabaseAttendance";
import { formatDateBR } from "@/lib/utils";

interface AttendanceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance | null;
}

export function AttendanceViewDialog({ open, onOpenChange, attendance }: AttendanceViewDialogProps) {
  if (!attendance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalhes da Frequência
          </DialogTitle>
          <DialogDescription>
            Visualizar informações completas do registro de frequência
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Data</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateBR(attendance.date)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-2">
                {attendance.is_present ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <Badge variant="default">Presente</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <Badge variant="destructive">Falta</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Aluno</label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{attendance.student_name || 'Aluno não encontrado'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Turma</label>
            <span className="block p-2 bg-muted rounded-md">
              {attendance.class_name || 'Turma não encontrada'}
            </span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Disciplina</label>
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-muted-foreground" />
              <span>{attendance.subject_name || 'Disciplina não encontrada'}</span>
            </div>
          </div>
          
          {attendance.justification && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Justificativa</label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{attendance.justification}</p>
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Registrado em: {new Date(attendance.created_at).toLocaleString('pt-BR')}
            </div>
            {attendance.updated_at !== attendance.created_at && (
              <div className="text-xs text-muted-foreground">
                Última atualização: {new Date(attendance.updated_at).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}