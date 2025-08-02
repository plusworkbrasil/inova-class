import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/user';
import { LayoutDashboard, User, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const navigate = useNavigate();

  useEffect(() => {
    // Recuperar dados do usuário do localStorage
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }
  }, []);

  const handleChangeUser = () => {
    navigate('/user-selection');
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/user-selection');
  };

  const getDashboardContent = () => {
    switch (userRole) {
      case 'student':
        return {
          title: 'Dashboard do Aluno',
          description: 'Bem-vindo ao seu painel acadêmico',
          cards: [
            { title: 'Minhas Notas', value: '8.5', description: 'Média geral' },
            { title: 'Frequência', value: '95%', description: 'Presença nas aulas' },
            { title: 'Faltas', value: '3', description: 'Total no período' },
          ]
        };
      case 'teacher':
        return {
          title: 'Dashboard do Professor',
          description: 'Gerencie suas turmas e atividades',
          cards: [
            { title: 'Turmas', value: '4', description: 'Turmas ativas' },
            { title: 'Alunos', value: '120', description: 'Total de alunos' },
            { title: 'Chamadas Pendentes', value: '2', description: 'Aguardando registro' },
            { title: 'Notas a Lançar', value: '15', description: 'Avaliações pendentes' },
          ]
        };
      case 'coordinator':
        return {
          title: 'Dashboard do Coordenador',
          description: 'Visão geral da coordenação acadêmica',
          cards: [
            { title: 'Turmas Gerenciadas', value: '8', description: 'Turmas sob coordenação' },
            { title: 'Professores', value: '25', description: 'Corpo docente' },
            { title: 'Relatórios', value: '12', description: 'Relatórios mensais' },
            { title: 'Reuniões', value: '3', description: 'Agendadas esta semana' },
          ]
        };
      case 'secretary':
        return {
          title: 'Dashboard da Secretaria',
          description: 'Gestão administrativa e documentos',
          cards: [
            { title: 'Matrículas', value: '450', description: 'Alunos matriculados' },
            { title: 'Declarações', value: '8', description: 'Pendentes de emissão' },
            { title: 'Documentos', value: '23', description: 'Aguardando validação' },
            { title: 'Atendimentos', value: '12', description: 'Agendados hoje' },
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
            { title: 'Total de Usuários', value: '245', description: 'Usuários ativos' },
            { title: 'Turmas', value: '18', description: 'Turmas ativas' },
            { title: 'Disciplinas', value: '32', description: 'Disciplinas oferecidas' },
            { title: 'Sistema', value: '99.9%', description: 'Disponibilidade' },
          ]
        };
    }
  };

  const content = getDashboardContent();

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
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
                <Badge variant="outline" className="capitalize">{userRole}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Você está acessando o sistema com perfil de <strong>{userRole}</strong>. 
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
              Com seu perfil de <Badge variant="outline" className="capitalize">{userRole}</Badge>, você tem acesso às seguintes funcionalidades no menu lateral:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {userRole === 'admin' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Usuários</Badge>
                  <Badge variant="secondary">• Turmas</Badge>
                  <Badge variant="secondary">• Disciplinas</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
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
                  <Badge variant="secondary">• Relatórios</Badge>
                </>
              )}
              {userRole === 'secretary' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                  <Badge variant="secondary">• Notas</Badge>
                </>
              )}
              {userRole === 'tutor' && (
                <>
                  <Badge variant="secondary">• Dashboard</Badge>
                  <Badge variant="secondary">• Frequência</Badge>
                  <Badge variant="secondary">• Declarações</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;