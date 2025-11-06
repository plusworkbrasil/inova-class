import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentSearchCombobox } from '@/components/ui/student-search-combobox';
import { useStudentHistory } from '@/hooks/useStudentHistory';
import { useStudentHistoryCharts } from '@/hooks/useStudentHistoryCharts';
import { StudentSearchResult } from '@/hooks/useStudentSearch';
import { GradesEvolutionChart } from '@/components/charts/GradesEvolutionChart';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { SubjectPerformanceChart } from '@/components/charts/SubjectPerformanceChart';
import { BookOpen, Calendar, User, CheckCircle, XCircle, BarChart3, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportStudentHistoryToPDF } from '@/lib/studentHistoryExport';
import { useToast } from '@/hooks/use-toast';

const StudentHistory = () => {
  const { profile } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const { toast } = useToast();
  const { data: historyData, loading } = useStudentHistory(selectedStudent?.id || null);
  const chartData = useStudentHistoryCharts(historyData);

  // Verificar permissão
  const hasAccess = profile && ['admin', 'coordinator', 'tutor'].includes(profile.role);

  if (!hasAccess) {
    return (
      <Layout>
        <Alert>
          <AlertDescription>
            Acesso negado. Esta página é apenas para Administradores, Coordenadores e Tutores.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const handleExportPDF = async () => {
    if (!selectedStudent || !historyData) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhum aluno selecionado para exportar.'
      });
      return;
    }

    setExportingPDF(true);
    try {
      await exportStudentHistoryToPDF({
        student: selectedStudent,
        historyData: historyData
      });
      
      toast({
        title: 'Sucesso',
        description: 'Histórico exportado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao exportar histórico em PDF.'
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 7) return 'text-green-600';
    if (percentage >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Histórico do Aluno</h1>
          </div>
          
          {selectedStudent && historyData && !loading && (
            <Button 
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          )}
        </div>

        {/* Busca de Aluno */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Aluno</CardTitle>
            <CardDescription>
              Digite o nome do aluno para visualizar seu histórico acadêmico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentSearchCombobox
              onStudentSelect={setSelectedStudent}
              selectedStudent={selectedStudent}
            />
          </CardContent>
        </Card>

        {/* Informações do Aluno Selecionado */}
        {selectedStudent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedStudent.name}
              </CardTitle>
              <CardDescription>
                Matrícula: {selectedStudent.student_id} | 
                Turma: {selectedStudent.class_name || 'Não definida'} | 
                Status: <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                  {selectedStudent.status}
                </Badge>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Histórico */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!loading && historyData && (
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="grades">Notas</TabsTrigger>
              <TabsTrigger value="attendance">Frequência</TabsTrigger>
            </TabsList>

            {/* Aba Resumo */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Total de Disciplinas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyData.subjects.size}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Total de Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyData.grades.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Registros de Frequência
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyData.attendance.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo por Disciplina */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Disciplina</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyData.subjects.size === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma disciplina encontrada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Array.from(historyData.subjects.entries()).map(([subjectId, subject]) => (
                        <div key={subjectId} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{subject.name}</h3>
                            </div>
                            {subject.total_grades > 0 && (
                              <Badge variant={subject.grade_average >= 7 ? 'default' : 'destructive'}>
                                Média: {subject.grade_average.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>📊 {subject.total_grades} notas</span>
                            <span>📅 {subject.attendance_count} registros de frequência</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Gráficos */}
            <TabsContent value="charts" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Visualização de Desempenho</h2>
              </div>
              
              {/* Evolução da Média */}
              <GradesEvolutionChart data={chartData.averageGradesByMonth} />
              
              {/* Frequência Mensal */}
              <AttendanceChart data={chartData.attendanceByMonth} />
              
              {/* Desempenho por Disciplina */}
              <SubjectPerformanceChart data={chartData.subjectPerformance} />
            </TabsContent>

            {/* Aba Notas */}
            <TabsContent value="grades" className="space-y-4">
              {historyData.grades.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Nenhuma nota encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                historyData.grades.map((grade: any) => (
                  <Card key={grade.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-semibold">{grade.subjects.name}</span>
                            <Badge variant="outline">{grade.type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(grade.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          {grade.observations && (
                            <p className="text-sm text-muted-foreground mt-2">{grade.observations}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getGradeColor((grade.value / grade.max_value) * 10)}`}>
                            {grade.value.toFixed(1)}/{grade.max_value.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {((grade.value / grade.max_value) * 10).toFixed(1)} pontos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Aba Frequência */}
            <TabsContent value="attendance" className="space-y-4">
              {historyData.attendance.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Nenhum registro de frequência</p>
                  </CardContent>
                </Card>
              ) : (
                historyData.attendance.map((record: any) => (
                  <Card key={record.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-semibold">{record.subject_name}</span>
                            <span className="text-sm text-muted-foreground">| {record.class_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          {record.justification && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Justificativa: {record.justification}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {record.is_present ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Presente
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Ausente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default StudentHistory;
