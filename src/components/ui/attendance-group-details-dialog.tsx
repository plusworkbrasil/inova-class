import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Edit, FileText, Trash2 } from 'lucide-react';
import { GroupedAttendance, Attendance } from '@/hooks/useSupabaseAttendance';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDateBR } from '@/lib/utils';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { BatchAttendanceEditDialog } from './batch-attendance-edit-dialog';

interface AttendanceGroupDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupedAttendance | null;
  onEdit?: (attendanceId: string) => void;
  onDelete?: (group: GroupedAttendance) => void;
  onBatchUpdate?: (updates: Array<{ id: string; updates: Partial<Attendance> }>) => Promise<void>;
  userRole?: string;
}

export const AttendanceGroupDetailsDialog = ({
  open,
  onOpenChange,
  group,
  onEdit,
  onDelete,
  onBatchUpdate,
  userRole
}: AttendanceGroupDetailsDialogProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);

  if (!group) return null;

  const handleDelete = () => {
    if (onDelete && group) {
      onDelete(group);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Chamada</span>
            <div className="flex gap-2">
              {['admin', 'secretary', 'tutor', 'coordinator'].includes(userRole || '') && onBatchUpdate && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBatchEditOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar em Lote
                </Button>
              )}
              {['admin', 'secretary'].includes(userRole || '') && onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Chamada
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDateBR(group.date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Turma</p>
                  <p className="font-medium">{group.class_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disciplina</p>
                  <p className="font-medium">{group.subject_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total de Alunos</p>
                  <p className="font-medium">{group.total_students}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    <Check size={12} className="mr-1" />
                    Presentes: {group.present_count}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    <X size={12} className="mr-1" />
                    Ausentes: {group.absent_count}
                  </Badge>
                </div>
              </div>

              {group.daily_activity && (
                <div className="mt-4">
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Atividade do Dia
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {group.daily_activity}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justificativa</TableHead>
                {onEdit && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.student_name}</TableCell>
                  <TableCell>{record.student_id || 'N/A'}</TableCell>
                  <TableCell>
                    {record.is_present ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check size={12} className="mr-1" />
                        Presente
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X size={12} className="mr-1" />
                        Falta
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.justification ? (
                      <span className="text-sm" title={record.justification}>
                        {record.justification}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {onEdit && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(record.id)}
                      >
                        <Edit size={14} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DeleteConfirmation
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleDelete}
          title="Excluir Registro de Chamada"
          description={`Tem certeza que deseja excluir esta chamada? Esta ação excluirá ${group.total_students} registro(s) de frequência e não poderá ser desfeita.`}
        />

        <BatchAttendanceEditDialog
          open={batchEditOpen}
          onOpenChange={setBatchEditOpen}
          group={group}
          onSave={async (updates) => {
            if (onBatchUpdate) {
              await onBatchUpdate(updates);
            }
          }}
          userRole={userRole}
        />
      </DialogContent>
    </Dialog>
  );
};
