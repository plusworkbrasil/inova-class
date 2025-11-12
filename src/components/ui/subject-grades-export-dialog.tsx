import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useInstructorSubjectGrades } from '@/hooks/useInstructorSubjectGrades';
import { exportGradesMatrixToPDF, exportGradesMatrixToExcel } from '@/lib/gradesExport';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubjectGradesExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string | null;
  classId: string | null;
  subjectName: string;
  className: string;
}

export const SubjectGradesExportDialog = ({
  open,
  onOpenChange,
  subjectId,
  classId,
  subjectName,
  className
}: SubjectGradesExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { students, evaluationTypes, loading, error } = useInstructorSubjectGrades(subjectId, classId);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportGradesMatrixToPDF({
        subjectName,
        className,
        students,
        evaluationTypes
      });
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportGradesMatrixToExcel({
        subjectName,
        className,
        students,
        evaluationTypes
      });
      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const renderGradeCell = (studentId: string, type: string) => {
    const student = students.find(s => s.student_id === studentId);
    if (!student) return null;

    const grades = student.grades_by_type[type] || [];
    
    if (grades.length === 0) {
      return (
        <div className="text-center text-muted-foreground">
          -
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-help">
              {grades.map((grade, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-semibold">{grade.value.toFixed(1)}</span>
                  <span className="text-muted-foreground">/{grade.max_value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              {grades.map((grade, idx) => (
                <div key={idx} className="text-xs">
                  <p>Data: {format(new Date(grade.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  <p>Nota: {grade.value.toFixed(1)}/{grade.max_value.toFixed(1)}</p>
                  {grade.observations && <p className="text-muted-foreground">Obs: {grade.observations}</p>}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Notas - {subjectName}</DialogTitle>
          <DialogDescription>
            Visualize e exporte as notas da turma {className}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={loading || isExporting || students.length === 0}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={loading || isExporting || students.length === 0}
              variant="outline"
              className="flex-1"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma nota registrada para esta disciplina ainda.</p>
            </div>
          )}

          {!loading && !error && students.length > 0 && (
            <ScrollArea className="h-[500px] rounded-md border">
              <div className="min-w-max">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      <th className="border p-2 text-left font-semibold sticky left-0 bg-muted z-20 min-w-[200px]">
                        Aluno
                      </th>
                      {evaluationTypes.map(type => (
                        <th key={type} className="border p-2 text-center font-semibold min-w-[120px]">
                          {type}
                        </th>
                      ))}
                      <th className="border p-2 text-center font-semibold min-w-[80px]">
                        Média
                      </th>
                      <th className="border p-2 text-center font-semibold min-w-[100px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.student_id} className="hover:bg-muted/50">
                        <td className="border p-2 sticky left-0 bg-background font-medium">
                          <div>
                            <div>{student.student_name}</div>
                            {student.student_number && (
                              <div className="text-xs text-muted-foreground">
                                Nº {student.student_number}
                              </div>
                            )}
                          </div>
                        </td>
                        {evaluationTypes.map(type => (
                          <td key={type} className="border p-2">
                            {renderGradeCell(student.student_id, type)}
                          </td>
                        ))}
                        <td className="border p-2 text-center font-semibold">
                          {student.average.toFixed(1)}
                        </td>
                        <td className="border p-2 text-center">
                          <Badge
                            variant={
                              student.status === 'approved'
                                ? 'default'
                                : student.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {student.status === 'approved'
                              ? 'Aprovado'
                              : student.status === 'failed'
                              ? 'Reprovado'
                              : 'Pendente'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}

          {!loading && !error && students.length > 0 && (
            <div className="p-4 bg-muted rounded-md space-y-2 text-sm">
              <p className="font-semibold">Legenda:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Aprovado</Badge>
                  <span className="text-xs text-muted-foreground">Média ≥ 7.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Reprovado</Badge>
                  <span className="text-xs text-muted-foreground">Média &lt; 7.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pendente</Badge>
                  <span className="text-xs text-muted-foreground">Sem notas</span>
                </div>
              </div>
              <div className="pt-2 border-t mt-2">
                <p className="text-xs text-muted-foreground">
                  Total de alunos: {students.length} | 
                  Aprovados: {students.filter(s => s.status === 'approved').length} | 
                  Reprovados: {students.filter(s => s.status === 'failed').length} | 
                  Pendentes: {students.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
