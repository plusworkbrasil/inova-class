import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useSelectedStudents, CreateSelectedStudentInput } from '@/hooks/useSelectedStudents';
import { toast } from '@/hooks/use-toast';

interface Row extends CreateSelectedStudentInput {
  error?: string;
}

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyRow = (): Row => ({ full_name: '', email: '', phone: '', cpf: '', shift: '', course_name: '' });

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchSelectedStudentsForm = ({ open, onOpenChange }: Props) => {
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);
  const { createBatch } = useSelectedStudents();

  const updateRow = (index: number, field: keyof CreateSelectedStudentInput, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value, error: undefined } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    let valid = true;
    const updated = rows.map(row => {
      if (!row.full_name && !row.email && !row.phone && !row.cpf) return row; // skip empty
      if (!row.full_name || row.full_name.length < 2) { valid = false; return { ...row, error: 'Nome inválido' }; }
      if (!emailRegex.test(row.email)) { valid = false; return { ...row, error: 'E-mail inválido' }; }
      if (!/^\d{10,15}$/.test(row.phone)) { valid = false; return { ...row, error: 'Telefone inválido' }; }
      if (!cpfRegex.test(row.cpf)) { valid = false; return { ...row, error: 'CPF inválido' }; }
      return { ...row, error: undefined };
    });
    setRows(updated);
    return valid;
  };

  const onSubmit = async () => {
    const filledRows = rows.filter(r => r.full_name || r.email || r.phone || r.cpf);
    if (filledRows.length === 0) {
      toast({ title: 'Preencha ao menos uma linha', variant: 'destructive' });
      return;
    }
    if (!validate()) return;
    const validRows = filledRows.filter(r => r.full_name && r.email);
    await createBatch.mutateAsync(validRows);
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro em Lote</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={row.error ? 'bg-destructive/10' : ''}>
                  <TableCell>
                    <Input value={row.full_name} onChange={e => updateRow(i, 'full_name', e.target.value)} placeholder="Nome" className="min-w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.email} onChange={e => updateRow(i, 'email', e.target.value)} placeholder="email@ex.com" className="min-w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.phone} onChange={e => updateRow(i, 'phone', e.target.value.replace(/\D/g, ''))} placeholder="11999999999" className="min-w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.cpf} onChange={e => updateRow(i, 'cpf', formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} className="min-w-[140px]" />
                  </TableCell>
                  <TableCell>
                    <Select value={row.shift || ''} onValueChange={v => updateRow(i, 'shift', v)}>
                      <SelectTrigger className="min-w-[100px]"><SelectValue placeholder="Turno" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noite">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {rows.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeRow(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.some(r => r.error) && (
          <div className="text-sm text-destructive">
            {rows.filter(r => r.error).map((r, i) => <p key={i}>Linha {rows.indexOf(r) + 1}: {r.error}</p>)}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
          <Plus className="h-4 w-4 mr-1" /> Adicionar Linha
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={createBatch.isPending}>
            {createBatch.isPending ? 'Salvando...' : 'Cadastrar Todos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
