import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Book, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subject {
  id: string;
  name: string;
  code?: string;
  workload?: number;
  status?: string;
  teacher_id?: string;
  profiles?: {
    name: string;
  };
}

interface ClassSubjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  className: string;
}

export function ClassSubjectsDialog({ open, onOpenChange, classId, className }: ClassSubjectsDialogProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && classId) {
      fetchSubjects();
    }
  }, [open, classId]);

  const fetchSubjects = async () => {
    if (!classId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          workload,
          status,
          teacher_id,
          profiles:teacher_id(name)
        `)
        .eq('class_id', classId);

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Disciplinas da Turma {className}
          </DialogTitle>
          <DialogDescription>
            Lista de todas as disciplinas cadastradas para esta turma
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma disciplina encontrada para esta turma</p>
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{subject.name}</h4>
                    {subject.code && (
                      <p className="text-sm text-muted-foreground">Código: {subject.code}</p>
                    )}
                  </div>
                  <Badge variant={subject.status === 'ativo' ? 'default' : 'secondary'}>
                    {subject.status || 'Ativo'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {subject.workload && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Carga: {subject.workload}h</span>
                    </div>
                  )}
                  
                  {subject.profiles?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Prof.: {subject.profiles.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}