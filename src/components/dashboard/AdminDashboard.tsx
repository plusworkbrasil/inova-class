import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import { BirthdayCard } from './BirthdayCard';
import { 
  Users, 
  GraduationCap, 
  AlertTriangle, 
  TrendingUp,
  UserCheck,
  ClipboardX,
  BookOpen,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Mock data para demonstração
const performanceData = [
  { month: 'Jan', notas: 8.2, faltas: 12 },
  { month: 'Fev', notas: 8.5, faltas: 8 },
  { month: 'Mar', notas: 8.1, faltas: 15 },
  { month: 'Abr', notas: 8.7, faltas: 6 },
  { month: 'Mai', notas: 8.9, faltas: 4 },
  { month: 'Jun', notas: 8.6, faltas: 7 },
];

const classDistribution = [
  { name: '1º Ano A', students: 28, color: '#3B82F6' },
  { name: '1º Ano B', students: 25, color: '#10B981' },
  { name: '2º Ano A', students: 30, color: '#F59E0B' },
  { name: '2º Ano B', students: 27, color: '#EF4444' },
  { name: '3º Ano A', students: 24, color: '#8B5CF6' },
  { name: '3º Ano B', students: 26, color: '#06B6D4' },
];

const frequentAbsentees = [
  { name: 'João Silva', class: '2º Ano A', absences: 8, lastAbsence: '2024-01-15' },
  { name: 'Maria Santos', class: '1º Ano B', absences: 6, lastAbsence: '2024-01-14' },
  { name: 'Pedro Costa', class: '3º Ano A', absences: 5, lastAbsence: '2024-01-13' },
  { name: 'Ana Oliveira', class: '2º Ano B', absences: 4, lastAbsence: '2024-01-12' },
];

const AdminDashboard = () => {
  const totalStudents = classDistribution.reduce((sum, cls) => sum + cls.students, 0);
  const activeClasses = classDistribution.length;
  const studentsWithManyAbsences = frequentAbsentees.filter(student => student.absences > 3).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard do Administrador</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema acadêmico</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Período: 2024
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Alunos"
          value={totalStudents}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 5.2, label: "vs mês anterior", isPositive: true }}
        />
        <StatsCard
          title="Turmas Ativas"
          value={activeClasses}
          icon={<GraduationCap className="h-4 w-4" />}
          trend={{ value: 0, label: "estáveis", isPositive: true }}
        />
        <StatsCard
          title="Alunos com +3 Faltas"
          value={studentsWithManyAbsences}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{ value: -12.5, label: "vs mês anterior", isPositive: true }}
        />
        <StatsCard
          title="Média Geral"
          value="8.6"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 3.1, label: "vs mês anterior", isPositive: true }}
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
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="notas" orientation="left" domain={[0, 10]} />
                    <YAxis yAxisId="faltas" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="notas" 
                      type="monotone" 
                      dataKey="notas" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Média de Notas"
                    />
                    <Line 
                      yAxisId="faltas" 
                      type="monotone" 
                      dataKey="faltas" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      name="Faltas"
                    />
                  </LineChart>
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
                  <PieChart>
                    <Pie
                      data={classDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="students"
                      label={({ name, students }) => `${name}: ${students}`}
                    >
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
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
              {frequentAbsentees.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">{student.absences} faltas</p>
                    <p className="text-xs text-muted-foreground">{student.lastAbsence}</p>
                  </div>
                </div>
              ))}
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
              {classDistribution.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: cls.color }}
                    />
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">Turma ativa</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{cls.students} alunos</p>
                    <p className="text-xs text-muted-foreground">Matriculados</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;