import { ReactNode } from 'react';
import Navigation from './Navigation';
import { UserRole } from '@/types/user';

interface LayoutProps {
  children: ReactNode;
  userRole: UserRole;
  userName: string;
  userAvatar?: string;
}

const Layout = ({ children, userRole, userName, userAvatar }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userRole={userRole} 
        userName={userName} 
        userAvatar={userAvatar} 
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