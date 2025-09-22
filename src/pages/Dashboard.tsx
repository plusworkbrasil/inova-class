import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/user';
import { LayoutDashboard, User, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoleTranslation } from '@/lib/roleTranslations';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useInstructorDashboardStats } from '@/hooks/useInstructorDashboardStats';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import StudentNotifications from '@/components/dashboard/StudentNotifications';
import StudentBanner from '@/components/dashboard/StudentBanner';
import StudentNotificationCenter from '@/components/dashboard/StudentNotificationCenter';

const Dashboard = () => {
  const { profile, loading: authLoading, isAuthenticated } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { stats: instructorStats, loading: instructorStatsLoading } = useInstructorDashboardStats();
  const { data: grades } = useSupabaseGrades();
  const { data: attendance } = useSupabaseAttendance();
  const navigate = useNavigate();
  
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';

  useEffect(() => {
    // Só redireciona se não estiver carregando E não estiver autenticado
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleChangeUser = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  const getDashboardContent = () => {
    // Calculate real student data from database
    const studentGrades = grades?.filter(g => g.student_id === profile?.id) || [];
    const studentAttendance = attendance?.filter(a => a.student_id === profile?.id) || [];
    
    const averageGrade = studentGrades.length > 0 
      ? (studentGrades.reduce((sum, grade) => sum + Number(grade.value), 0) / studentGrades.length).toFixed(1)
      : '0.0';
    
    const totalAttendanceDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(a => a.is_present).length;
    const attendancePercentage = totalAttendanceDays > 0 
      ? `${Math.round((presentDays / totalAttendanceDays) * 100)}%`
      : '0%';
    
    const totalAbsences = studentAttendance.filter(a => !a.is_present).length;

    switch (userRole) {
      case 'student':
        return {
          title: 'Dashboard do Aluno',
          description: 'Bem-vindo ao seu painel acadêmico',
          cards: [
            { title: 'Minhas Notas', value: averageGrade, description: 'Média geral' },
            { title: 'Frequência', value: attendancePercentage, description: 'Presença nas aulas' },
            { title: 'Faltas', value: totalAbsences.toString(), description: 'Total no período' },
          ]
        };
      case 'teacher':
        return {
          title: 'Dashboard do Instrutor',
          description: 'Gerencie suas turmas e atividades',
          cards: [
            { title: 'Minhas Turmas', value: instructorStatsLoading ? '...' : instructorStats.myClasses.toString(), description: 'Turmas que leciono' },
            { title: 'Meus Alunos', value: instructorStatsLoading ? '...' : instructorStats.myStudents.toString(), description: 'Alunos das minhas turmas' },
            { title: 'Chamadas Pendentes', value: instructorStatsLoading ? '...' : instructorStats.pendingAttendance.toString(), description: 'Aguardando registro' },
            { title: 'Notas a Lançar', value: instructorStatsLoading ? '...' : instructorStats.gradesToLaunch.toString(), description: 'Avaliações pendentes' },
          ]
        };
      case 'coordinator':
        return {
          title: 'Dashboard do Coordenador',
          description: 'Visão geral da coordenação acadêmica',
          cards: [
            { title: 'Turmas Gerenciadas', value: statsLoading ? '...' : stats.totalClasses.toString(), description: 'Turmas sob coordenação' },
            { title: 'Instrutores', value: statsLoading ? '...' : stats.totalTeachers.toString(), description: 'Corpo docente' },
            { title: 'Relatórios', value: '0', description: 'Relatórios mensais' },
            { title: 'Reuniões', value: '0', description: 'Agendadas esta semana' },
          ]
        };
      case 'secretary':
        return {
          title: 'Dashboard da Secretaria',
          description: 'Gestão administrativa e documentos',
          cards: [
            { title: 'Matrículas', value: statsLoading ? '...' : stats.totalStudents.toString(), description: 'Alunos matriculados' },
            { title: 'Declarações', value: statsLoading ? '...' : stats.pendingDeclarations.toString(), description: 'Pendentes de emissão' },
            { title: 'Documentos', value: statsLoading ? '...' : stats.totalDeclarations.toString(), description: 'Total no sistema' },
            { title: 'Atendimentos', value: '0', description: 'Agendados hoje' },
          ]
        };
      case 'tutor':
        return {
          title: 'Dashboard do Tutor',
          description: 'Acompanhamento dos alunos tutorados',
          cards: [
            { title: 'Alunos Tutorados', value: '15', description: 'Sob sua tutoria' },
            { title: 'Reuniões', value: '5', description: 'Agendadas esta semana' },
            { title: 'Relatórios', value: '3', description: 'Pendentes de entrega' },
            { title: 'Alertas', value: '2', description: 'Alunos em risco' },
          ]
        };
      default:
        return {
          title: 'Dashboard do Administrador',
          description: 'Visão geral completa do sistema',
          cards: [
            { title: 'Total de Usuários', value: statsLoading ? '...' : stats.totalUsers.toString(), description: 'Usuários ativos' },
            { title: 'Turmas', value: statsLoading ? '...' : stats.totalClasses.toString(), description: 'Turmas ativas' },
            { title: 'Disciplinas', value: statsLoading ? '...' : stats.totalSubjects.toString(), description: 'Disciplinas oferecidas' },
            { title: 'Frequência Geral', value: stats.attendanceRate, description: 'Taxa de presença dos alunos' },
          ]
        };
    }
  };

  const content = getDashboardContent();

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        {/* Banner de avisos urgentes para alunos */}
        {userRole === 'student' && (
          <StudentBanner studentRole={userRole} />
        )}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
            <p className="text-muted-foreground">{content.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleChangeUser} className="flex items-center gap-2">
              <RefreshCw size={16} />
              Trocar Usuário
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>

        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Logado como: {userName}</p>
                <Badge variant="outline">{getRoleTranslation(userRole)}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Você está acessando o sistema com perfil de <strong>{getRoleTranslation(userRole)}</strong>. 
              Use o menu lateral para navegar pelas funcionalidades disponíveis para este tipo de usuário.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.cards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard size={20} />
              Funcionalidades Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Com seu perfil de <Badge variant="outline">{getRoleTranslation(userRole)}</Badge>, você tem acesso às seguintes funcionalidades no menu lateral:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {userRole === 'admin' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Usuários</Badge>
                  <Badge variant="secondary">• Turmas</Badge>
                  <Badge variant="secondary">• Disciplinas</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Comunicação</Badge>
                  <Badge variant="secondary">• Relatórios</Badge>
                  <Badge variant="secondary">• Configurações</Badge>
                </>
              )}
              {userRole === 'teacher' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Chamada</Badge>
                  <Badge variant="secondary">• Notas</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                </>
              )}
              {userRole === 'student' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Meu Perfil</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                </>
              )}
              {userRole === 'coordinator' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Turmas</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Disciplinas</Badge>
                  <Badge variant="secondary">• Comunicação</Badge>
                  <Badge variant="secondary">• Relatórios</Badge>
                </>
              )}
              {userRole === 'secretary' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                  <Badge variant="secondary">• Notas</Badge>
                  <Badge variant="secondary">• Comunicação</Badge>
                </>
              )}
              {userRole === 'tutor' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                  <Badge variant="secondary">• Comunicação</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Módulo de Avisos Completo para Alunos */}
        {userRole === 'student' && (
          <StudentNotificationCenter studentRole={userRole} />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;