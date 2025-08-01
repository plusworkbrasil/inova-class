import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { UserRole } from '@/types/user';

const Index = () => {
  // Para demonstração, simulando um usuário administrador
  // Em um app real, isso viria da autenticação
  const [currentUser] = useState({
    role: 'admin' as UserRole,
    name: 'Administrador Geral',
    email: 'admin@inovaclass.edu.br',
    avatar: undefined
  });

  return (
    <Layout 
      userRole={currentUser.role}
      userName={currentUser.name}
      userAvatar={currentUser.avatar}
    >
      <AdminDashboard />
    </Layout>
  );
};

export default Index;
