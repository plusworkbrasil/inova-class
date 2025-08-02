import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se já existe um usuário logado
    const savedRole = localStorage.getItem('userRole');
    
    if (savedRole) {
      // Se já existe usuário logado, ir para o dashboard
      navigate('/dashboard');
    } else {
      // Se não, ir para seleção de usuário
      navigate('/user-selection');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
