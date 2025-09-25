import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import { BirthdayCard } from './BirthdayCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useReportsData } from '@/hooks/useReportsData';
import { Users, GraduationCap, AlertTriangle, TrendingUp, UserCheck, ClipboardX, BookOpen, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
const AdminDashboard = () => {
  const {
    stats,
    loading: statsLoading
  } = useDashboardStats();
  const {
    data: reportsData,
    loading: reportsLoading
  } = useReportsData();
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard do Administrador</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total de Alunos" value={statsLoading ? "..." : stats.totalStudents} icon={<Users className="h-4 w-4" />} trend={{
        value: 0,
        label: "estudantes cadastrados",
        isPositive: true
      }} />
        <StatsCard title="Turmas Ativas" value={statsLoading ? "..." : stats.totalClasses} icon={<GraduationCap className="h-4 w-4" />} trend={{
        value: 0,
        label: "turmas cadastradas",
        isPositive: true
      }} />
        <StatsCard title="Declarações Pendentes" value={statsLoading ? "..." : stats.pendingDeclarations} icon={<AlertTriangle className="h-4 w-4" />} trend={{
        value: 0,
        label: "aguardando processamento",
        isPositive: false
      }} />
        <StatsCard title="Taxa de Frequência" value={statsLoading ? "..." : stats.attendanceRate} icon={<TrendingUp className="h-4 w-4" />} trend={{
        value: 0,
        label: "frequência geral",
        isPositive: true
      }} />
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
                    </div> : <LineChart data={reportsData.attendanceByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="presente" stroke="#10B981" strokeWidth={3} name="% Presentes" />
                      <Line type="monotone" dataKey="falta" stroke="#EF4444" strokeWidth={3} name="% Faltas" />
                    </LineChart>}
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
            <CardTitle className="flex items-center">
              <ClipboardX className="w-5 h-5 mr-2 text-destructive" />
              Alunos com Maior Número de Faltas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div> : reportsData.topAbsentStudents.length > 0 ? reportsData.topAbsentStudents.slice(0, 4).map((student, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">{student.absences} faltas</p>
                      <p className="text-xs text-muted-foreground">{student.percentage}% de faltas</p>
                    </div>
                  </div>) : <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado de faltas encontrado</p>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Active Classes */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-secondary" />
              Turmas em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div> : reportsData.classDistribution.length > 0 ? reportsData.classDistribution.map((cls, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{
                  backgroundColor: cls.color
                }} />
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">Turma ativa</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{cls.value} alunos</p>
                      <p className="text-xs text-muted-foreground">Matriculados</p>
                    </div>
                  </div>) : <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma turma encontrada</p>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminDashboard;