import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import { Users, BookOpen, CheckCircle, AlertTriangle, Key, Monitor } from 'lucide-react';
import { useInstructorDashboardStats } from '@/hooks/useInstructorDashboardStats';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';
import { useEquipmentAllocations } from '@/hooks/useEquipmentAllocations';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard = () => {
  const { stats, loading, error } = useInstructorDashboardStats();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { data: allAllocations } = useEquipmentAllocations();
  const navigate = useNavigate();
  
  // Filtrar alocações do instrutor (simplificado - idealmente verificar pelo ID do usuário autenticado)
  const myAllocations = allAllocations.filter(
    a => a.status === 'ativo'
  );
  
  const pendingReturns = myAllocations.filter(
    a => new Date(a.end_date) < new Date()
  ).length;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Instrutor</h1>
          <p className="text-muted-foreground">
            Visão geral das suas turmas e alunos
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsChangePasswordOpen(true)}
          className="flex items-center gap-2 mt-4 md:mt-0"
        >
          <Key className="h-4 w-4" />
          Alterar Senha
        </Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Minhas Alocações
            </CardTitle>
            <CardDescription>
              Equipamentos que você alocou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alocações Ativas</span>
                <Badge variant="default">{myAllocations.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Devoluções Pendentes</span>
                <Badge variant="destructive">{pendingReturns}</Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/equipment')}
              >
                Gerenciar Equipamentos
              </Button>
            </div>
          </CardContent>
        </Card>
        
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
              Acesse o menu "Frequência" para registrar presença
            </p>
          </CardContent>
        </Card>
      </div>

      <ChangeOwnPasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
};

export default InstructorDashboard;
