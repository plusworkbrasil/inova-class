import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { role: resolvedRole, loading: roleLoading } = useUserRole(user?.id);

  console.log('[Layout] Auth state:', {
    userId: user?.id,
    profileRole: profile?.role,
    loading,
    isAuthenticated
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayRole = (resolvedRole || 'student') as UserRole;
  const displayName = profile?.name || user?.email || 'Usuário';
  const displayAvatar = '';

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userRole={displayRole} 
        userName={displayName} 
        userAvatar={displayAvatar} 
      />
      
      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 pt-20 md:pt-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-background px-6 py-4">
          <div className="flex justify-center items-center text-sm text-muted-foreground">
            <span>Sistema desenvolvido por: </span>
            <a 
              href="https://www.pluswork.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:text-primary/80 transition-colors underline"
            >
              PlusWork.com.br
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;