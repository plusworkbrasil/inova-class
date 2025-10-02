import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck, FileText, Settings, LogOut, Menu, X, UserX, Monitor, Mail, User, Megaphone, Shield } from 'lucide-react';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { getRoleTranslation } from '@/lib/roleTranslations';
interface NavigationProps {
  userRole: UserRole;
  userName: string;
  userAvatar?: string;
}
const menuItems = {
  admin: [{
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
    label: 'Notas por Disciplina',
    path: '/subject-grades'
  }, {
    icon: UserX,
    label: 'Evasões',
    path: '/evasions'
  }, {
    icon: FileText,
    label: 'Comunicação',
    path: '/communications'
  }, {
    icon: FileText,
    label: 'Relatórios',
    path: '/reports'
  }, {
    icon: Settings,
    label: 'Configurações',
    path: '/settings'
  }],
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
  }],
  tutor: [{
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  }, {
    icon: ClipboardCheck,
    label: 'Frequência',
    path: '/attendance'
  }, {
    icon: FileText,
    label: 'Declarações',
    path: '/declarations'
  }, {
    icon: Mail,
    label: 'Comunicação',
    path: '/communications'
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
  const currentMenuItems = menuItems[userRole] || [];
  const toggleMenu = () => setIsOpen(!isOpen);
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
        <nav className="p-4 space-y-2">
          {currentMenuItems.map((item, index) => <Button key={index} variant={isActivePath(item.path) ? "default" : "ghost"} className="w-full justify-start" onClick={() => handleNavigation(item.path)}>
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>)}
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