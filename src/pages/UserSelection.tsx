import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/user';
import { User, GraduationCap, BookOpen, Users, Settings, Crown } from 'lucide-react';

const UserSelection = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const navigate = useNavigate();

  const userProfiles = {
    admin: {
      name: 'Administrador',
      description: 'Acesso completo ao sistema',
      icon: Crown,
      color: 'bg-red-500',
      permissions: ['Gerenciar usuários', 'Configurar sistema', 'Acessar todos os relatórios', 'Gerenciar turmas e disciplinas']
    },
    teacher: {
      name: 'Instrutor João Silva',
      description: 'Acesso a notas e chamadas',
      icon: GraduationCap,
      color: 'bg-blue-500',
      permissions: ['Registrar chamadas', 'Lançar notas', 'Ver declarações', 'Acessar dashboard']
    },
    student: {
      name: 'Aluno Maria Santos',
      description: 'Visualizar notas e frequência',
      icon: User,
      color: 'bg-green-500',
      permissions: ['Ver minhas notas', 'Ver minha frequência', 'Solicitar declarações', 'Dashboard pessoal']
    },
    coordinator: {
      name: 'Coordenador Ana Costa',
      description: 'Gerenciar turmas e relatórios',
      icon: Users,
      color: 'bg-purple-500',
      permissions: ['Gerenciar turmas', 'Ver frequência', 'Acessar relatórios', 'Gerenciar disciplinas']
    },
    secretary: {
      name: 'Secretário Pedro Oliveira',
      description: 'Gerenciar matrículas e declarações',
      icon: BookOpen,
      color: 'bg-orange-500',
      permissions: ['Ver frequência', 'Emitir declarações', 'Lançar notas', 'Dashboard operacional']
    },
    tutor: {
      name: 'Tutor Carlos Souza',
      description: 'Acompanhar alunos específicos',
      icon: User,
      color: 'bg-teal-500',
      permissions: ['Ver frequência dos tutorados', 'Solicitar declarações', 'Dashboard de tutoria']
    }
  };

  const handleAccessSystem = () => {
    // Salvar o tipo de usuário no localStorage para simular login
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userName', userProfiles[selectedRole].name);
    
    // Navegar para o dashboard
    navigate('/dashboard');
    
    // Recarregar a página para aplicar as mudanças
    window.location.reload();
  };

  const selectedProfile = userProfiles[selectedRole];
  const IconComponent = selectedProfile.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Inova Class</h1>
          <p className="text-xl text-muted-foreground">Sistema Acadêmico</p>
          <p className="text-sm text-muted-foreground">Selecione o tipo de usuário para acessar o sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Seleção de Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Usuário:</label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 Administrador</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 Instrutor</SelectItem>
                  <SelectItem value="student">🎓 Aluno</SelectItem>
                  <SelectItem value="coordinator">👩‍💼 Coordenador</SelectItem>
                  <SelectItem value="secretary">📋 Secretário</SelectItem>
                  <SelectItem value="tutor">👨‍🎓 Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`${selectedProfile.color} p-3 rounded-full text-white`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProfile.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Permissões de acesso:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleAccessSystem}
              className="w-full"
              size="lg"
            >
              Acessar Sistema como {selectedProfile.name}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>Sistema desenvolvido por: <a href="https://www.pluswork.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PlusWork.com.br</a></p>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;