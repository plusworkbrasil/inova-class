import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useInstructorSubjectAttendance } from "@/hooks/useInstructorSubjectAttendance";
import { exportAttendanceMatrixToPDF, exportAttendanceMatrixToExcel } from "@/lib/attendanceExport";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SubjectAttendanceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string | null;
  classId: string | null;
  subjectName: string;
  className: string;
}

export const SubjectAttendanceExportDialog = ({
  open,
  onOpenChange,
  subjectId,
  classId,
  subjectName,
  className
}: SubjectAttendanceExportDialogProps) => {
  const { students, dates, loading, error } = useInstructorSubjectAttendance(
    subjectId,
    classId
  );

  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      toast.info('Gerando PDF...', { duration: 2000 });
      
      await exportAttendanceMatrixToPDF({
        subjectName,
        className,
        students,
        dates
      });
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      toast.info('Gerando Excel...', { duration: 2000 });
      
      exportAttendanceMatrixToExcel({
        subjectName,
        className,
        students,
        dates
      });
      
      toast.success('Arquivo Excel gerado com sucesso!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Erro ao gerar Excel. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderCell = (
    status: 'present' | 'absent' | null,
    justification?: string
  ) => {
    if (status === 'present') {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-success font-bold">C</span>
        </div>
      );
    }
    if (status === 'absent') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-full cursor-help">
                <span className="text-destructive font-bold">F</span>
              </div>
            </TooltipTrigger>
            {justification && (
              <TooltipContent>
                <p className="max-w-xs">{justification}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">-</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Chamadas - {subjectName} ({className})
          </DialogTitle>
          <DialogDescription>
            Visualize e exporte as chamadas registradas para esta disciplina
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleExportPDF}
            disabled={loading || isExporting || students.length === 0}
            variant="outline"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={loading || isExporting || students.length === 0}
            variant="outline"
            size="sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Erro ao carregar chamadas: {error}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma chamada registrada para esta disciplina ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left text-sm font-medium sticky left-0 bg-muted z-10 min-w-[200px]">
                        Aluno
                      </th>
                      {dates.map((date) => (
                        <th key={date} className="border p-2 text-center text-xs font-medium min-w-[60px]">
                          {formatDate(date)}
                        </th>
                      ))}
                      <th className="border p-2 text-center text-sm font-medium min-w-[100px]">
                        % Presença
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-muted/50">
                        <td className="border p-2 text-sm sticky left-0 bg-background z-10">
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            {student.student_number && (
                              <p className="text-xs text-muted-foreground">
                                {student.student_number}
                              </p>
                            )}
                          </div>
                        </td>
                        {dates.map((date) => {
                          const record = student.attendance_by_date[date];
                          return (
                            <td key={date} className="border p-2 text-center">
                              {renderCell(
                                record?.status || null,
                                record?.justification
                              )}
                            </td>
                          );
                        })}
                        <td className="border p-2 text-center text-sm font-medium">
                          {student.attendance_percentage.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold mb-2">Legenda:</p>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-success font-bold">C</span>
                    <span>= Compareceu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive font-bold">F</span>
                    <span>= Faltou</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">-</span>
                    <span>= Não registrado</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
