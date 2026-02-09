import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatsCard from './StatsCard';
import { BirthdayCard } from './BirthdayCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useReportsData } from '@/hooks/useReportsData';

import { Users, GraduationCap, AlertTriangle, TrendingUp, UserCheck, ClipboardX, BookOpen, Calendar, Key, Filter, AlertOctagon, ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';
import { useEquipmentStats } from '@/hooks/useEquipmentStats';
import { useStudentsAtRisk } from '@/hooks/useStudentsAtRisk';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [absentStudentsPage, setAbsentStudentsPage] = useState(1);
  
  const handleViewStudentHistory = (studentId: string) => {
    navigate(`/student-history?studentId=${studentId}`);
  };
  
  const {
    stats,
    loading: statsLoading
  } = useDashboardStats();
  const {
    data: reportsData,
    loading: reportsLoading
  } = useReportsData();
  
  const classesFromAbsences = useMemo(() => {
    const uniqueClasses = [...new Set(reportsData.topAbsentStudents.map(s => s.class))].filter(Boolean);
    return uniqueClasses.sort();
  }, [reportsData.topAbsentStudents]);
  const { stats: equipmentStats } = useEquipmentStats();
  const { data: studentsAtRisk, loading: riskLoading } = useStudentsAtRisk();
  
  // Filtrar alunos com faltas por turma selecionada
  const filteredTopAbsentStudents = useMemo(() => {
    if (selectedClass === 'all') {
      return reportsData.topAbsentStudents;
    }
    return reportsData.topAbsentStudents.filter(student => student.class === selectedClass);
  }, [reportsData.topAbsentStudents, selectedClass]);

  // Paginação dos alunos com faltas
  const paginatedAbsentStudents = useMemo(() => {
    const startIndex = (absentStudentsPage - 1) * ITEMS_PER_PAGE;
    return filteredTopAbsentStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTopAbsentStudents, absentStudentsPage]);

  const totalAbsentPages = Math.ceil(filteredTopAbsentStudents.length / ITEMS_PER_PAGE);

  // Reset página ao mudar filtro de turma
  useEffect(() => {
    setAbsentStudentsPage(1);
  }, [selectedClass]);

  // Filtrar alunos em risco crítico (apenas ativos)
  const criticalStudents = useMemo(() => {
    return studentsAtRisk
      .filter(s => s.risk_level === 'critical' && s.status === 'active')
      .slice(0, 3);
  }, [studentsAtRisk]);

  const totalCriticalStudents = useMemo(() => {
    return studentsAtRisk.filter(s => s.risk_level === 'critical' && s.status === 'active').length;
  }, [studentsAtRisk]);
  
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard do Administrador</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Filtro de Turma */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {!classesLoading && classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setIsChangePasswordOpen(true)}
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Alterar Senha
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/class-timeline')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Visão de Turmas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total de Alunos" 
          value={statsLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.totalStudents === 0 ? <span className="text-destructive">Erro</span> : stats.totalStudents} 
          icon={<Users className="h-4 w-4" />} 
          trend={{
            value: 0,
            label: "estudantes cadastrados",
            isPositive: true
          }} 
        />
        <StatsCard 
          title="Turmas Ativas" 
          value={statsLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.totalClasses === 0 ? <span className="text-destructive">Erro</span> : stats.totalClasses} 
          icon={<GraduationCap className="h-4 w-4" />} 
          trend={{
            value: 0,
            label: "turmas cadastradas",
            isPositive: true
          }} 
        />
        <StatsCard 
          title="Declarações Pendentes" 
          value={statsLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.pendingDeclarations} 
          icon={<AlertTriangle className="h-4 w-4" />} 
          trend={{
            value: 0,
            label: "aguardando processamento",
            isPositive: false
          }} 
        />
        <StatsCard 
          title="Taxa de Frequência" 
          value={statsLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.attendanceRate} 
          icon={<TrendingUp className="h-4 w-4" />} 
          trend={{
            value: 0,
            label: "frequência geral",
            isPositive: true
          }} 
        />
      </div>

      {/* Widget de Alunos em Risco Crítico */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-destructive" />
              <span>Alunos em Risco Crítico</span>
              {totalCriticalStudents > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalCriticalStudents}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/students-at-risk')}
              className="text-muted-foreground hover:text-foreground"
            >
              Ver Todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riskLoading ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : criticalStudents.length > 0 ? (
            <div className="space-y-3">
              {criticalStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-3 bg-background rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => handleViewStudentHistory(student.student_id)}
                        className="font-medium text-foreground hover:text-primary hover:underline text-left"
                      >
                        {student.student?.name || 'Nome não disponível'}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {student.student_class?.name || 'Sem turma'}
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      Score: {student.risk_score || 0}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Frequência: <span className="text-destructive font-medium">{student.attendance_percentage?.toFixed(0) || 0}%</span>
                    </span>
                    <span>
                      Média: <span className="font-medium">{student.grade_average?.toFixed(1) || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {student.last_intervention ? (
                      <span>
                        Última intervenção: {formatDistanceToNow(new Date(student.last_intervention), { addSuffix: true, locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-warning">Sem intervenções registradas</span>
                    )}
                    {(student.interventions_count ?? 0) > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {student.interventions_count} intervenção(ões)
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {totalCriticalStudents > 3 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  + {totalCriticalStudents - 3} outros alunos em risco crítico
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-muted-foreground">Nenhum aluno em risco crítico</p>
              <p className="text-sm text-muted-foreground/70">Todos os alunos estão em situação regular</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Birthday Card and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Gráfico de Desempenho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {reportsLoading ? <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div> : reportsData.attendanceTotals.length > 0 ? <PieChart>
                      <Pie 
                        data={reportsData.attendanceTotals} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {reportsData.attendanceTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value}%`}
                      />
                    </PieChart> : <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Sem dados de frequência</p>
                    </div>}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Class Distribution Chart */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-primary" />
                  Alunos por Turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  ) : reportsData.classDistribution.length > 0 ? (
                    <PieChart>
                      <Pie 
                        data={reportsData.classDistribution} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        fill="#8884d8" 
                        dataKey="value" 
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {reportsData.classDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <p className="text-muted-foreground">Nenhum dado disponível</p>
                      <p className="text-sm text-muted-foreground">
                        Verifique se há alunos cadastrados
                      </p>
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Birthday Card */}
        <div>
          <BirthdayCard />
        </div>
      </div>

      {/* Equipment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Alocações Ativas</span>
              <Badge variant="default">{equipmentStats.activeAllocations}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Equipamentos Disponíveis</span>
              <Badge variant="secondary">{equipmentStats.available}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Alocações Atrasadas</span>
              <Badge variant="destructive">{equipmentStats.overdue}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Em Manutenção</span>
              <Badge variant="outline">{equipmentStats.inMaintenance}</Badge>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => navigate('/equipment')}
            >
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequent Absentees */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center">
                <ClipboardX className="w-5 h-5 mr-2 text-destructive" />
                Alunos com Maior Número de Faltas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[160px] h-8">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {!classesLoading && classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {reportsData.topAbsentStudentsPeriod || 'Últimos 7 dias'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              ) : filteredTopAbsentStudents.length > 0 ? (
                <>
                  {paginatedAbsentStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex-1 cursor-pointer" onClick={() => handleViewStudentHistory(student.student_id)}>
                        <p className="font-medium text-primary hover:underline">{student.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{student.class}</span>
                          {student.studentId && (
                            <>
                              <span>•</span>
                              <span className="font-mono">ID: {student.studentId}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">{student.absences} faltas</p>
                        <p className="text-xs text-muted-foreground">{student.percentage}% de faltas</p>
                      </div>
                    </div>
                  ))}
                  {filteredTopAbsentStudents.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {(absentStudentsPage - 1) * ITEMS_PER_PAGE + 1}-
                        {Math.min(absentStudentsPage * ITEMS_PER_PAGE, filteredTopAbsentStudents.length)} de {filteredTopAbsentStudents.length}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={absentStudentsPage === 1}
                          onClick={() => setAbsentStudentsPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={absentStudentsPage >= totalAbsentPages}
                          onClick={() => setAbsentStudentsPage(p => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedClass === 'all' 
                      ? 'Nenhum dado de faltas encontrado' 
                      : `Nenhum aluno com faltas na turma ${selectedClass}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Subjects */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-secondary" />
              Turmas em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div> : reportsData.activeSubjects.length > 0 ? reportsData.activeSubjects.map((subject, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{
                  backgroundColor: subject.color
                }} />
                      <div>
                        <p className="font-medium">{subject.subjectName}</p>
                        <p className="text-sm text-muted-foreground">{subject.className} • {subject.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">Termina em</p>
                      <p className="text-sm text-muted-foreground">{subject.endDate}</p>
                    </div>
                  </div>) : <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma disciplina em andamento</p>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangeOwnPasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>;
};
export default AdminDashboard;