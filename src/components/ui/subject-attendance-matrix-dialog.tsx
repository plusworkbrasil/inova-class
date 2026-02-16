import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInstructorSubjectAttendance } from '@/hooks/useInstructorSubjectAttendance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, AlertCircle, FileDown, FileSpreadsheet, BarChart3, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportAttendanceMatrixToPDF, exportAttendanceMatrixToExcel } from '@/lib/attendanceExport';
import { toast } from 'sonner';

interface SubjectAttendanceMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string | null;
  classId: string | null;
  subjectName: string;
  className: string;
}

export const SubjectAttendanceMatrixDialog = ({
  open,
  onOpenChange,
  subjectId,
  classId,
  subjectName,
  className
}: SubjectAttendanceMatrixDialogProps) => {
  const { students, dates, loading, error } = useInstructorSubjectAttendance(
    open ? subjectId : null,
    open ? classId : null
  );

  // Calcular estatísticas gerais da turma
  const classStats = useMemo(() => {
    if (students.length === 0) {
      return { averageAttendance: 0, totalPresent: 0, totalAbsent: 0, totalRecords: 0 };
    }
    const totalPresent = students.reduce((sum, s) => sum + s.total_present, 0);
    const totalAbsent = students.reduce((sum, s) => sum + s.total_absent, 0);
    const totalRecords = totalPresent + totalAbsent;
    const averageAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    return { averageAttendance, totalPresent, totalAbsent, totalRecords };
  }, [students]);

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      return format(new Date(year, month - 1, day), 'dd/MM', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleExportPDF = async () => {
    try {
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
    }
  };

  const handleExportExcel = () => {
    try {
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
    }
  };

  const renderCell = (status: 'present' | 'absent' | null, justification?: string) => {
    if (status === null) {
      return (
        <div className="flex items-center justify-center h-10 text-muted-foreground">
          -
        </div>
      );
    }

    const content = (
      <div 
        className={`flex items-center justify-center h-10 font-semibold rounded ${
          status === 'present' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}
      >
        {status === 'present' ? 'C' : 'F'}
      </div>
    );

    if (justification) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{justification}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <CalendarDays className="h-6 w-6 text-primary" />
                Chamadas - {subjectName}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{className}</span>
                </div>
                {!loading && students.length > 0 && (
                  <Badge variant="outline">
                    {students.length} {students.length === 1 ? 'aluno' : 'alunos'}
                  </Badge>
                )}
                {!loading && dates.length > 0 && (
                  <Badge variant="outline">
                    {dates.length} {dates.length === 1 ? 'chamada' : 'chamadas'}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={loading || students.length === 0 || dates.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={loading || students.length === 0 || dates.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-semibold">Erro ao carregar dados</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
              <p className="text-sm text-muted-foreground">
                Esta turma ainda não possui alunos matriculados
              </p>
            </div>
          ) : dates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Nenhuma chamada registrada</p>
              <p className="text-sm text-muted-foreground">
                Ainda não há registros de frequência para esta disciplina
              </p>
            </div>
          ) : (
            <>
              {/* Resumo de presença geral da turma */}
              <div className="mb-4 p-4 bg-muted/50 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Resumo da Turma
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{students.length}</div>
                      <div className="text-xs text-muted-foreground">Alunos</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{classStats.averageAttendance.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Média de Presença</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{classStats.totalPresent}</div>
                      <div className="text-xs text-muted-foreground">Presenças</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold">{classStats.totalAbsent}</div>
                      <div className="text-xs text-muted-foreground">Faltas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela com barra de rolagem vertical e horizontal */}
              <ScrollArea className="h-[400px] w-full border rounded-lg">
                <div className="min-w-max">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-background">
                      <tr className="border-b">
                        <th className="sticky left-0 z-30 bg-background px-4 py-3 text-left font-semibold min-w-[200px]">
                          Aluno
                        </th>
                        {dates.map((date) => (
                          <th 
                            key={date} 
                            className="px-3 py-3 text-center font-semibold min-w-[60px] text-sm"
                          >
                            {formatDate(date)}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-semibold min-w-[100px]">
                          % Presença
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr 
                          key={student.student_id} 
                          className={`border-b hover:bg-muted/50 ${
                            student.attendance_percentage < 75 
                              ? 'bg-red-50 dark:bg-red-950/30' 
                              : ''
                          }`}
                        >
                          <td className={`sticky left-0 z-10 px-4 py-2 ${
                            student.attendance_percentage < 75 
                              ? 'bg-red-50 dark:bg-red-950/30' 
                              : 'bg-background'
                          }`}>
                            <div>
                              <div className="font-medium">{student.student_name}</div>
                              {student.student_number && (
                                <div className="text-xs text-muted-foreground">
                                  #{student.student_number}
                                </div>
                              )}
                            </div>
                          </td>
                          {dates.map((date) => (
                            <td key={date} className="px-2 py-2">
                              {renderCell(
                                student.attendance_by_date[date]?.status || null,
                                student.attendance_by_date[date]?.justification
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center">
                            <Badge 
                              variant={student.attendance_percentage >= 75 ? 'default' : 'destructive'}
                            >
                              {student.attendance_percentage.toFixed(0)}%
                            </Badge>
                            {student.total_recorded > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {student.total_present}/{student.total_recorded}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Legenda:</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-semibold text-green-700 dark:text-green-300">
                      C
                    </div>
                    <span>Compareceu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center font-semibold text-red-700 dark:text-red-300">
                      F
                    </div>
                    <span>Faltou</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground">
                      -
                    </div>
                    <span>Sem registro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"></div>
                    <span>Frequência abaixo de 75%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
