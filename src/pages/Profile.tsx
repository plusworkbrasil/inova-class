import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunications } from '@/hooks/useCommunications';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Mail, Phone, MapPin, GraduationCap, BookOpen, Megaphone, AlertCircle } from 'lucide-react';
import { getRoleTranslation } from '@/lib/roleTranslations';
import { UserRole } from '@/types/user';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: communications, loading: commLoading } = useCommunications();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as UserRole;
    const storedName = localStorage.getItem('user_name');
    
    if (storedRole) setUserRole(storedRole);
    if (storedName) setUserName(storedName);
  }, []);

  // Filtrar avisos da secretaria para alunos
  const secretaryNotices = communications?.filter(comm => 
    comm.is_published && 
    comm.published_at &&
    new Date(comm.published_at) <= new Date() &&
    (!comm.expires_at || new Date(comm.expires_at) > new Date()) &&
    comm.target_audience?.includes('student') &&
    comm.created_by_role === 'secretary'
  ) || [];

  // Mock data para demonstração
  const studentData = {
    id: '001',
    name: userName || 'Aluno Exemplo',
    email: user?.email || 'aluno@exemplo.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    enrollment: '2024001',
    course: 'Administração',
    semester: '3º Semestre',
    entryDate: '2023-02-15',
    status: 'Ativo'
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">Média</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Normal</Badge>;
    }
  };

  if (!isAuthenticated) {
    return <div>Acesso não autorizado</div>;
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Visualize suas informações pessoais e avisos importantes
          </p>
        </div>

        {/* Avisos da Secretaria */}
        {secretaryNotices.length > 0 && (
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Avisos da Secretaria</CardTitle>
              </div>
              <CardDescription>
                Informações importantes da secretaria acadêmica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {secretaryNotices.map((notice) => (
                    <Alert key={notice.id} className="bg-card">
                      <AlertCircle className="h-4 w-4" />
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTitle className="font-semibold">{notice.title}</AlertTitle>
                            {getPriorityBadge(notice.priority)}
                          </div>
                          <AlertDescription className="text-sm text-muted-foreground">
                            {notice.content}
                          </AlertDescription>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>📅 {new Date(notice.published_at!).toLocaleDateString('pt-BR')}</span>
                            {notice.expires_at && (
                              <span>⏰ Expira em: {new Date(notice.expires_at).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-lg">
                    {studentData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{studentData.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{getRoleTranslation(userRole)}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{studentData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{studentData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{studentData.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Matrícula desde {new Date(studentData.entryDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Acadêmicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Acadêmicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
                  <p className="text-sm font-semibold">{studentData.enrollment}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">
                    <Badge variant="default" className="bg-green-500">
                      {studentData.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{studentData.course}</p>
                    <p className="text-xs text-muted-foreground">Curso</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{studentData.semester}</p>
                    <p className="text-xs text-muted-foreground">Período Atual</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;