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
      <div className="md:ml-64">
        <main className="p-6 pt-20 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;