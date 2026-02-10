import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck, FileText, Settings, LogOut, Menu, X, UserX, Monitor, Mail, User, Megaphone, Shield, History, AlertTriangle, ChevronDown } from 'lucide-react';
import { UserRole } from '@/types/user';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { getRoleTranslation } from '@/lib/roleTranslations';
interface NavigationProps {
  userRole: UserRole;
  userName: string;
  userAvatar?: string;
}

type MenuItem = { icon: any; label: string; path: string };
type MenuEntry =
  | { type: 'item'; icon: any; label: string; path: string }
  | { type: 'group'; label: string; icon: any; items: MenuItem[] };

const adminMenuGroups: MenuEntry[] = [
  { type: 'item', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    type: 'group',
    label: 'Gestão de Aulas',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Turmas', path: '/classes' },
      { icon: Users, label: 'Usuários', path: '/users' },
      { icon: BookOpen, label: 'Disciplinas', path: '/subjects' },
      { icon: ClipboardCheck, label: 'Frequência', path: '/attendance' },
      { icon: UserX, label: 'Evasões', path: '/evasions' },
      { icon: BookOpen, label: 'Notas por Disciplina', path: '/subject-grades' },
    ],
  },
  {
    type: 'group',
    label: 'Relatórios',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Relatório Geral', path: '/reports' },
      { icon: History, label: 'Histórico do Aluno', path: '/student-history' },
      { icon: AlertTriangle, label: 'Alunos Faltosos', path: '/student-absences' },
    ],
  },
  {
    type: 'group',
    label: 'Gestão Administrativa',
    icon: Monitor,
    items: [
      { icon: Monitor, label: 'Equipamentos', path: '/equipment' },
      { icon: Mail, label: 'Comunicação', path: '/communications' },
    ],
  },
  { type: 'item', icon: Settings, label: 'Configurações', path: '/settings' },
];

const menuItems = {
  coordinator: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: GraduationCap,
    label: 'Turmas',
    path: '/classes'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: BookOpen,
    label: 'Disciplinas',
    path: '/subjects'
  }, {
    icon: UserX,
    label: 'Acompanhamento',
    path: '/evasions'
  }, {
    icon: Mail,
    label: 'Comunicação',
    path: '/communications'
  }, {
    icon: FileText,
    label: 'Relatórios',
    path: '/reports'
  }, {
    icon: History,
    label: 'Histórico do Aluno',
    path: '/student-history'
  }, {
    icon: AlertTriangle,
    label: 'Alunos Faltosos',
    path: '/student-absences'
  }],
  secretary: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: Users,
    label: 'Usuários',
    path: '/users'
  }, {
    icon: GraduationCap,
    label: 'Turmas',
    path: '/classes'
  }, {
    icon: BookOpen,
    label: 'Disciplinas',
    path: '/subjects'
  }, {
    icon: Monitor,
    label: 'Equipamentos',
    path: '/equipment'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: BookOpen,
    label: 'Notas',
    path: '/grades'
  }, {
    icon: FileText,
    label: 'Declarações',
    path: '/declarations'
  }, {
    icon: UserX,
    label: 'Evasões',
    path: '/evasions'
  }, {
    icon: Megaphone,
    label: 'Avisos',
    path: '/notices'
  }, {
    icon: FileText,
    label: 'Comunicação',
    path: '/communications'
  }, {
    icon: FileText,
    label: 'Relatórios',
    path: '/reports'
  }],
  tutor: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: GraduationCap,
    label: 'Turmas',
    path: '/classes'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: BookOpen,
    label: 'Disciplinas',
    path: '/subjects'
  }, {
    icon: BookOpen,
    label: 'Notas por Disciplina',
    path: '/subject-grades'
  }, {
    icon: UserX,
    label: 'Evasões',
    path: '/evasions'
  }, {
    icon: FileText,
    label: 'Declarações',
    path: '/declarations'
  }, {
    icon: Mail,
    label: 'Comunicação',
    path: '/communications'
  }, {
    icon: FileText,
    label: 'Relatórios',
    path: '/reports'
  }, {
    icon: History,
    label: 'Histórico do Aluno',
    path: '/student-history'
  }, {
    icon: AlertTriangle,
    label: 'Alunos Faltosos',
    path: '/student-absences'
  }, {
    icon: AlertTriangle,
    label: 'Alunos em Risco',
    path: '/students-at-risk'
  }, {
    icon: GraduationCap,
    label: 'Visão de Turmas',
    path: '/class-timeline'
  }],
  teacher: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: ClipboardCheck,
    label: 'Chamada',
    path: '/attendance'
  }, {
    icon: BookOpen,
    label: 'Notas',
    path: '/teacher-grades'
  }],
  instructor: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: BookOpen,
    label: 'Minhas Disciplinas',
    path: '/instructor-subjects'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: BookOpen,
    label: 'Notas',
    path: '/teacher-grades'
  }, {
    icon: Monitor,
    label: 'Equipamentos',
    path: '/equipment'
  }],
  student: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: User,
    label: 'Meu Perfil',
    path: '/profile'
  }, {
    icon: BookOpen,
    label: 'Minhas Notas',
    path: '/student-grades'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: FileText,
    label: 'Declarações',
    path: '/declarations'
  }]
};
const Navigation = ({
  userRole,
  userName,
  userAvatar
}: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signOut
  } = useAuth();
  const currentMenuItems = userRole === 'admin' ? [] : (menuItems[userRole as keyof typeof menuItems] || []);
  const toggleMenu = () => setIsOpen(!isOpen);
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      // Se o erro for "Session not found", ignorar (usuário já está deslogado)
      if (error?.message?.includes('Session not found') || 
          error?.message?.includes('session_not_found')) {
        console.log('Sessão já estava inválida, limpando dados locais');
      } else {
        console.error('Erro ao fazer logout:', error);
      }
    } finally {
      // Sempre redirecionar para login, independente do erro
      navigate('/auth');
    }
  };
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  return <>
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" onClick={toggleMenu}>
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Header */}
        <div className="flex items-center justify-center p-6 bg-gradient-to-r from-primary to-secondary">
          <div className="text-center">
            <h1 className="font-bold text-primary-foreground text-3xl">Inova Class</h1>
            <p className="text-primary-foreground/80 text-xs font-extrabold">Acompanhamento de Curso</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userAvatar} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleTranslation(userRole)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {userRole === 'admin' ? (
            adminMenuGroups.map((entry, index) => {
              if (entry.type === 'item') {
                return (
                  <Button key={index} variant={isActivePath(entry.path) ? "default" : "ghost"} className="w-full justify-start" onClick={() => handleNavigation(entry.path)}>
                    <entry.icon className="mr-3 h-4 w-4" />
                    {entry.label}
                  </Button>
                );
              }
              const groupHasActiveRoute = entry.items.some(item => isActivePath(item.path));
              return (
                <Collapsible key={index} defaultOpen={groupHasActiveRoute}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-md">
                    <span className="flex items-center gap-2">
                      <entry.icon className="h-4 w-4" />
                      {entry.label}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1 mt-1">
                    {entry.items.map((item, itemIndex) => (
                      <Button key={itemIndex} variant={isActivePath(item.path) ? "default" : "ghost"} className="w-full justify-start" onClick={() => handleNavigation(item.path)}>
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            currentMenuItems.map((item, index) => (
              <Button key={index} variant={isActivePath(item.path) ? "default" : "ghost"} className="w-full justify-start" onClick={() => handleNavigation(item.path)}>
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            ))
          )}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>;
};
export default Navigation;