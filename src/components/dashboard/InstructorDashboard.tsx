import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from './StatsCard';
import { Users, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { useInstructorDashboardStats } from '@/hooks/useInstructorDashboardStats';

const InstructorDashboard = () => {
  const { stats, loading, error } = useInstructorDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Instrutor</h1>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Instrutor</h1>
          <p className="text-destructive">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Instrutor</h1>
        <p className="text-muted-foreground">
          Visão geral das suas turmas e alunos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Minhas Turmas"
          value={stats.myClasses}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatsCard
          title="Taxa de Presença"
          value={`${stats.attendancePercentage}%`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Média Geral"
          value={stats.averageGrade.toFixed(1)}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Alunos Evadidos"
          value={stats.evadedStudents}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Disciplinas</CardTitle>
            <CardDescription>
              Disciplinas que você leciona atualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acesse o menu "Disciplinas" para ver detalhes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frequência Recente</CardTitle>
            <CardDescription>
              Registros de presença dos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acesse o menu "Chamada" para registrar presença
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorDashboard;
