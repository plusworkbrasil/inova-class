import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, X, Users, RefreshCw } from 'lucide-react';
import { GroupedAttendance, Attendance } from '@/hooks/useSupabaseAttendance';
import { formatDateBR } from '@/lib/utils';

interface BatchAttendanceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupedAttendance | null;
  onSave: (updates: Array<{ id: string; updates: Partial<Attendance> }>) => Promise<void>;
  userRole?: string;
}

interface StudentEdit {
  id: string;
  student_name: string;
  is_present: boolean;
  justification?: string;
  isModified: boolean;
  is_evaded?: boolean;
}

export const BatchAttendanceEditDialog = ({
  open,
  onOpenChange,
  group,
  onSave,
  userRole
}: BatchAttendanceEditDialogProps) => {
  const [students, setStudents] = useState<StudentEdit[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && group) {
      const initialStudents = group.records.map(record => ({
        id: record.id,
        student_name: record.student_name || 'Nome não disponível',
        is_present: record.is_present,
        justification: record.justification,
        isModified: false,
        is_evaded: record.is_evaded
      }));
      setStudents(initialStudents);
      setSelectedIds([]);
    }
  }, [open, group]);

  const handleSelectAll = () => {
    const selectableStudents = students.filter(s => !s.is_evaded);
    if (selectedIds.length === selectableStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableStudents.map(s => s.id));
    }
  };

  const handleInvertSelection = () => {
    const newSelection = students
      .filter(s => !selectedIds.includes(s.id) && !s.is_evaded)
      .map(s => s.id);
    setSelectedIds(newSelection);
  };

  const toggleStudent = (id: string, isEvaded?: boolean) => {
    if (isEvaded) return; // Não permitir seleção de evadidos
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const markAsPresent = () => {
    setStudents(prev =>
      prev.map(s =>
        selectedIds.includes(s.id)
          ? { ...s, is_present: true, justification: undefined, isModified: true }
          : s
      )
    );
  };

  const markAsAbsent = () => {
    setStudents(prev =>
      prev.map(s =>
        selectedIds.includes(s.id)
          ? { ...s, is_present: false, justification: s.justification || 'Falta não justificada', isModified: true }
          : s
      )
    );
  };

  const updateStudentStatus = (id: string, is_present: boolean, isEvaded?: boolean) => {
    if (isEvaded) return; // Não permitir edição de evadidos
    setStudents(prev =>
      prev.map(s =>
        s.id === id
          ? {
              ...s,
              is_present,
              justification: is_present ? undefined : (s.justification || 'Falta não justificada'),
              isModified: true
            }
          : s
      )
    );
  };

  const updateJustification = (id: string, justification: string, isEvaded?: boolean) => {
    if (isEvaded) return; // Não permitir edição de evadidos
    setStudents(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, justification, isModified: true }
          : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = students
        .filter(s => s.isModified)
        .map(s => ({
          id: s.id,
          updates: {
            is_present: s.is_present,
            justification: s.is_present ? null : (s.justification || 'Falta não justificada')
          }
        }));

      if (updates.length === 0) {
        onOpenChange(false);
        return;
      }

      await onSave(updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving batch updates:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!group) return null;

  const modifiedCount = students.filter(s => s.isModified).length;
  const presentCount = students.filter(s => s.is_present).length;
  const absentCount = students.length - presentCount;
  const evadedCount = students.filter(s => s.is_evaded).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edição em Lote - {group.subject_name} ({group.class_name})</DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>{' '}
                <span className="font-medium">{formatDateBR(group.date)}</span>
              </div>
              <Badge variant="outline">
                <Users size={12} className="mr-1" />
                Total: {students.length}
              </Badge>
              <Badge variant="default" className="bg-green-600">
                <Check size={12} className="mr-1" />
                Presentes: {presentCount}
              </Badge>
              <Badge variant="destructive">
                <X size={12} className="mr-1" />
                Ausentes: {absentCount}
              </Badge>
              {evadedCount > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Evadidos: {evadedCount}
                </Badge>
              )}
              {modifiedCount > 0 && (
                <Badge variant="secondary">
                  <RefreshCw size={12} className="mr-1" />
                  {modifiedCount} alteração(ões)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedIds.length === students.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInvertSelection}
          >
            Inverter Seleção
          </Button>
          <div className="flex-1" />
          <Button
            variant="default"
            size="sm"
            onClick={markAsPresent}
            disabled={selectedIds.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check size={14} className="mr-1" />
            Marcar como Presentes ({selectedIds.length})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={markAsAbsent}
            disabled={selectedIds.length === 0}
          >
            <X size={14} className="mr-1" />
            Marcar como Faltosos ({selectedIds.length})
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === students.length && students.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className={`
                    ${student.isModified ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                    ${student.is_evaded ? 'opacity-60' : ''}
                  `}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id, student.is_evaded)}
                      disabled={student.is_evaded}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {student.student_name}
                      {student.is_evaded && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          EVADIDO
                        </Badge>
                      )}
                      {student.isModified && (
                        <Badge variant="secondary" className="text-xs">
                          Modificado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={student.is_present ? 'present' : 'absent'}
                      onValueChange={(value) => updateStudentStatus(student.id, value === 'present', student.is_evaded)}
                      disabled={student.is_evaded}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-green-600" />
                            Presente
                          </div>
                        </SelectItem>
                        <SelectItem value="absent">
                          <div className="flex items-center gap-2">
                            <X size={14} className="text-red-600" />
                            Falta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {!student.is_present ? (
                      <Input
                        placeholder="Justificativa da falta..."
                        value={student.justification || ''}
                        onChange={(e) => updateJustification(student.id, e.target.value, student.is_evaded)}
                        disabled={student.is_evaded}
                        className="max-w-xs"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || modifiedCount === 0}
          >
            {saving ? 'Salvando...' : `Salvar ${modifiedCount} Alteração(ões)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
