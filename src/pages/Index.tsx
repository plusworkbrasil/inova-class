import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="font-bold text-gray-900 mb-4 text-6xl">InovaClass</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Gestor de Acompanhamento de Cursos</p>
        </div>
        
        <div className="space-y-4">
          <Button onClick={() => navigate('/auth')} size="lg" className="px-8 py-3 text-lg">
            Entrar no Sistema
          </Button>
          
          <div className="text-sm text-gray-500">Acesso exclusivo para alunos, instrutores e gestores do INOVASE</div>
        </div>
      </div>
    </div>;
};
export default Index;