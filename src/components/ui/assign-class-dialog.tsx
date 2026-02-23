import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSelectedStudents, SelectedStudent } from '@/hooks/useSelectedStudents';
import { useClasses } from '@/hooks/useClasses';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: SelectedStudent[];
}

const shiftLabel: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

export const AssignClassDialog = ({ open, onOpenChange, students }: Props) => {
  const [classId, setClassId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [results, setResults] = useState<{ name: string; password: string; error?: string }[]>([]);
  const { enrollStudent } = useSelectedStudents();
  const { classes } = useClasses();

  const handleEnroll = async () => {
    if (!classId) {
      toast({ title: 'Selecione uma turma', variant: 'destructive' });
      return;
    }
    setEnrolling(true);
    const newResults: typeof results = [];

    for (const student of students) {
      try {
        const data = await enrollStudent.mutateAsync({
          selectedStudentId: student.id,
          classId,
        });
        newResults.push({ name: student.full_name, password: data.temp_password });
      } catch (error: any) {
        newResults.push({ name: student.full_name, password: '', error: error.message });
      }
    }

    setResults(newResults);
    setEnrolling(false);
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({ title: 'Senha copiada!' });
  };

  const handleClose = () => {
    onOpenChange(false);
    setResults([]);
    setClassId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atribuir a Turma</DialogTitle>
          <DialogDescription>
            {results.length === 0
              ? `${students.length} aluno(s) confirmado(s) selecionado(s)`
              : 'Resultado da matrícula'}
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <>
            <div className="space-y-3">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                <SelectContent>
                  {(classes || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {students.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span>{s.full_name}</span>
                    {s.confirmed_shift && <Badge variant="outline">{shiftLabel[s.confirmed_shift] || s.confirmed_shift}</Badge>}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Matriculando...' : 'Matricular'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`p-2 rounded text-sm ${r.error ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    {r.error ? (
                      <Badge variant="destructive">Erro</Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-background px-2 py-1 rounded">{r.password}</code>
                        <Button size="icon" variant="ghost" onClick={() => copyPassword(r.password)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                  {r.error && <p className="text-xs text-destructive mt-1">{r.error}</p>}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
