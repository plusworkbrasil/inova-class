import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunications } from '@/hooks/useCommunications';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CalendarDays, Mail, Phone, MapPin, GraduationCap, BookOpen, Megaphone, AlertCircle, User, Key } from 'lucide-react';
import { getRoleTranslation } from '@/lib/roleTranslations';
import { UserRole } from '@/types/user';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';

const Profile = () => {
  const { user, profile, isAuthenticated } = useAuth();
  const { data: communications, loading: commLoading } = useCommunications();
  const { data: classes } = useSupabaseClasses();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Fallback para quando não temos profile ainda
  const userRole = (profile?.role as UserRole) || 'student';
  const userName = profile?.name || user?.email || 'Usuário';

  // Filtrar avisos da secretaria para alunos
  const secretaryNotices = communications?.filter(comm => 
    comm.is_published && 
    comm.published_at &&
    new Date(comm.published_at) <= new Date() &&
    (!comm.expires_at || new Date(comm.expires_at) > new Date()) &&
    comm.target_audience?.includes('student')
  ) || [];

  // Dados reais do profile do banco de dados
  const profileData = {
    id: profile?.id || '',
    name: profile?.name || userName,
    email: profile?.email || user?.email || '',
    phone: profile?.phone || 'Não informado',
    address: profile?.street && profile?.city ? 
      `${profile.street}${profile.number ? `, ${profile.number}` : ''} - ${profile.city}, ${profile.state || ''}` :
      'Endereço não informado',
    enrollment: profile?.enrollment_number || profile?.student_id || (profile as any)?.auto_student_id || 'Não informado',
    course: 'Curso não informado', // Este campo não existe na tabela profiles ainda
    semester: 'Semestre não informado', // Este campo não existe na tabela profiles ainda
    entryDate: profile?.enrollment_date || profile?.created_at || new Date().toISOString(),
    status: profile?.status || 'Ativo',
    cep: profile?.cep || '',
    city: profile?.city || '',
    state: profile?.state || '',
    avatar: profile?.avatar || '',
    class_id: profile?.class_id || '',
    class_name: classes?.find(c => c.id === profile?.class_id)?.name || '',
    cpf: (profile as any)?.cpf || '',
    rg: (profile as any)?.rg || '',
    birth_date: (profile as any)?.birth_date || '',
    parent_name: (profile as any)?.parent_name || '',
    parent_phone: (profile as any)?.parent_phone || ''
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
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-lg">
                    {profileData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profileData.name}</CardTitle>
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
                  <span className="text-sm">{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Cadastrado desde {new Date(profileData.entryDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  <Key className="h-4 w-4" />
                  Alterar Senha
                </Button>
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
                  <label className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Matrícula' : 'Identificação'}
                  </label>
                  <p className="text-sm font-semibold">{profileData.enrollment}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">
                    <Badge variant="default" className="bg-green-500">
                      {profileData.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {userRole === 'student' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{profileData.course}</p>
                        <p className="text-xs text-muted-foreground">Curso</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{profileData.semester}</p>
                        <p className="text-xs text-muted-foreground">Período Atual</p>
                      </div>
                    </div>
                    {profileData.class_name && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{profileData.class_name}</p>
                          <p className="text-xs text-muted-foreground">Turma</p>
                        </div>
                      </div>
                    )}
                    {profileData.parent_name && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{profileData.parent_name}</p>
                          <p className="text-xs text-muted-foreground">Responsável</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {profileData.cep && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{profileData.cep} - {profileData.city}/{profileData.state}</p>
                      <p className="text-xs text-muted-foreground">CEP</p>
                    </div>
                  </div>
                )}
                {profileData.cpf && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{profileData.cpf}</p>
                      <p className="text-xs text-muted-foreground">CPF</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <ChangeOwnPasswordDialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />
      </div>
    </Layout>
  );
};

export default Profile;