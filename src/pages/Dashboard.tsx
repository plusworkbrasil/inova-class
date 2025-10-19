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
import { useCoordinatorDashboardStats } from '@/hooks/useCoordinatorDashboardStats';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import InstructorDashboard from '@/components/dashboard/InstructorDashboard';
import StudentBanner from '@/components/dashboard/StudentBanner';
import StudentNotificationCenter from '@/components/dashboard/StudentNotificationCenter';
import { BirthdayCard } from '@/components/dashboard/BirthdayCard';

const Dashboard = () => {
  const { profile, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // NÃO carregamos dados aqui - cada dashboard carrega seus próprios dados
  // Isso evita queries antes do role estar pronto
  const userRole = profile?.role as UserRole | undefined;
  const userName = profile?.name || 'Usuário';

  useEffect(() => {
    const checkAuth = async () => {
      // Só redireciona se não estiver carregando E não estiver autenticado
      if (!authLoading && !isAuthenticated) {
        navigate('/auth', { replace: true });
      }
    };
    
    checkAuth();
  }, [authLoading, isAuthenticated, navigate]);

  // Se não tiver papel definido, mostrar loading
  if (authLoading || !userRole) {
    console.log('⏳ [Dashboard] Aguardando role do usuário...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  console.log('✅ [Dashboard] Role carregado:', userRole);

  // Renderizar dashboard específico por papel (cada um carrega seus próprios dados)
  if (userRole === 'admin') {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <AdminDashboard />
      </Layout>
    );
  }

  if (userRole === 'instructor') {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <InstructorDashboard />
      </Layout>
    );
  }

  const handleChangeUser = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  // Para papéis restantes (student, coordinator, secretary, tutor)
  // Cada um terá um dashboard simples sem queries pesadas no topo
  const getDashboardContent = () => {

    switch (userRole) {
      case 'student':
        return {
          title: 'Dashboard do Aluno',
          description: 'Bem-vindo ao seu painel acadêmico',
          cards: [
            { title: 'Minhas Notas', value: 'Ver Notas', description: 'Acesse suas notas' },
            { title: 'Frequência', value: 'Ver Frequência', description: 'Acesse sua frequência' },
            { title: 'Declarações', value: 'Solicitar', description: 'Solicite declarações' },
          ]
        };
      case 'coordinator':
        return {
          title: 'Dashboard do Coordenador',
          description: 'Visão geral da coordenação acadêmica',
          cards: [
            { title: 'Turmas Gerenciadas', value: 'Carregando...', description: 'Total de turmas sob coordenação' },
            { title: 'Instrutores', value: 'Carregando...', description: 'Total de instrutores ativos' },
            { title: 'Frequência Geral', value: 'Carregando...', description: 'Taxa média de presença' },
          ]
        };
      case 'secretary':
        return {
          title: 'Dashboard da Secretaria',
          description: 'Gestão administrativa e documentos',
          cards: [
            { title: 'Matrículas', value: 'Carregando...', description: 'Alunos matriculados' },
            { title: 'Declarações', value: 'Carregando...', description: 'Pendentes de emissão' },
            { title: 'Documentos', value: 'Carregando...', description: 'Total no sistema' },
          ]
        };
      case 'tutor':
        return {
          title: 'Dashboard do Tutor',
          description: 'Acompanhamento dos alunos tutorados',
          cards: [
            { title: 'Alunos Tutorados', value: 'Carregando...', description: 'Sob sua tutoria' },
            { title: 'Reuniões', value: 'Carregando...', description: 'Agendadas esta semana' },
            { title: 'Relatórios', value: 'Carregando...', description: 'Pendentes de entrega' },
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Visão geral do sistema',
          cards: []
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
          {/* Ocultar botões em desktop para instructor e student */}
          {!['instructor', 'student'].includes(userRole) && (
            <div className="hidden md:flex gap-2">
              <Button variant="outline" onClick={handleChangeUser} className="flex items-center gap-2">
                <RefreshCw size={16} />
                Trocar Usuário
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={16} />
                Sair
              </Button>
            </div>
          )}
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

        {/* Birthday Card for Secretary */}
        {userRole === 'secretary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
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
                    <Badge variant="secondary">• Dashboard</Badge>
                    <Badge variant="secondary">• Usuários</Badge>
                    <Badge variant="secondary">• Turmas</Badge>
                    <Badge variant="secondary">• Disciplinas</Badge>
                    <Badge variant="secondary">• Equipamentos</Badge>
                    <Badge variant="secondary">• Frequência</Badge>
                    <Badge variant="secondary">• Declarações</Badge>
                    <Badge variant="secondary">• Notas</Badge>
                    <Badge variant="secondary">• Comunicação</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <BirthdayCard />
            </div>
          </div>
        )}

        {/* Original Funcionalidades Card for other roles */}
        {userRole !== 'secretary' && (
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
                    <Badge variant="secondary">• Acompanhamento</Badge>
                    <Badge variant="secondary">• Comunicação</Badge>
                    <Badge variant="secondary">• Relatórios</Badge>
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
        )}

        {/* Módulo de Avisos Completo para Alunos */}
        {userRole === 'student' && (
          <StudentNotificationCenter studentRole={userRole} />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
