import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatsCard from './StatsCard';
import { BirthdayCard } from './BirthdayCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useReportsData } from '@/hooks/useReportsData';
import { useClasses } from '@/hooks/useClasses';
import { Users, GraduationCap, AlertTriangle, TrendingUp, UserCheck, ClipboardX, BookOpen, Calendar, Key, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
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
  
  const { data: classes, loading: classesLoading } = useClasses();
  
  // Filtrar alunos com faltas por turma selecionada
  const filteredTopAbsentStudents = useMemo(() => {
    if (selectedClass === 'all') {
      return reportsData.topAbsentStudents;
    }
    return reportsData.topAbsentStudents.filter(student => student.class === selectedClass);
  }, [reportsData.topAbsentStudents, selectedClass]);
  
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
                        label={({ name, value, count }) => `${name}: ${value}% (${count})`}
                      >
                        {reportsData.attendanceTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value}% (${props.payload.count} registros)`,
                          name
                        ]}
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
                  {reportsLoading ? <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div> : <PieChart>
                      <Pie data={reportsData.classDistribution} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({
                    name,
                    value
                  }) => `${name}: ${value}`}>
                        {reportsData.classDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>}
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

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequent Absentees */}
        <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClipboardX className="w-5 h-5 mr-2 text-destructive" />
                  Alunos com Maior Número de Faltas
                  {selectedClass !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      • {selectedClass}
                    </span>
                  )}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {reportsData.topAbsentStudentsPeriod || 'Últimos 7 dias'}
                </span>
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div> : filteredTopAbsentStudents.length > 0 ? filteredTopAbsentStudents.slice(0, 4).map((student, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex-1 cursor-pointer" onClick={() => handleViewStudentHistory(student.student_id)}>
                      <p className="font-medium text-primary hover:underline">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">{student.absences} faltas</p>
                      <p className="text-xs text-muted-foreground">{student.percentage}% de faltas</p>
                    </div>
                  </div>) : <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedClass === 'all' 
                      ? 'Nenhum dado de faltas encontrado' 
                      : `Nenhum aluno com faltas na turma ${selectedClass}`}
                  </p>
                </div>}
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