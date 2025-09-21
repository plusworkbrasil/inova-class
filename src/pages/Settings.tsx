import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, School, Bell, Shield, Save, FileText, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const Settings = () => {
  const { settings, loading, saving, updateSettings, saveSettings } = useSettings();

  // Mock data para logs de auditoria
  const auditLogs = [
    {
      id: 1,
      timestamp: new Date('2024-01-15T10:30:00'),
      user: 'Admin',
      action: 'CRIAR',
      entity: 'Usuário',
      entityName: 'João Silva',
      details: 'Criou novo usuário com perfil Instrutor',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      timestamp: new Date('2024-01-15T09:15:00'),
      user: 'Admin',
      action: 'EDITAR',
      entity: 'Turma',
      entityName: '1º Ano A',
      details: 'Alterou coordenador da turma',
      ip: '192.168.1.100'
    },
    {
      id: 3,
      timestamp: new Date('2024-01-15T08:45:00'),
      user: 'Coordenador Maria',
      action: 'DELETAR',
      entity: 'Disciplina',
      entityName: 'Educação Física',
      details: 'Removeu disciplina do sistema',
      ip: '192.168.1.105'
    },
    {
      id: 4,
      timestamp: new Date('2024-01-14T16:20:00'),
      user: 'Admin',
      action: 'CRIAR',
      entity: 'Disciplina',
      entityName: 'Matemática Avançada',
      details: 'Criou nova disciplina',
      ip: '192.168.1.100'
    },
    {
      id: 5,
      timestamp: new Date('2024-01-14T14:10:00'),
      user: 'Secretaria Pedro',
      action: 'EDITAR',
      entity: 'Usuário',
      entityName: 'Ana Costa',
      details: 'Atualizou informações de contato',
      ip: '192.168.1.102'
    },
    {
      id: 6,
      timestamp: new Date('2024-01-14T11:30:00'),
      user: 'Admin',
      action: 'CONFIGURAR',
      entity: 'Sistema',
      entityName: 'Configurações Gerais',
      details: 'Alterou configurações de notificação',
      ip: '192.168.1.100'
    },
  ];

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CRIAR': return 'default';
      case 'EDITAR': return 'secondary';
      case 'DELETAR': return 'destructive';
      case 'CONFIGURAR': return 'outline';
      default: return 'outline';
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
  };

  if (loading) {
    return (
      <Layout userRole="admin" userName="Admin" userAvatar="">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <Button 
            className="flex items-center gap-2" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon size={16} />
              Geral
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center gap-2">
              <School size={16} />
              Escola
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User size={16} />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield size={16} />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText size={16} />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">Nome da Escola</Label>
                    <Input 
                      id="school_name" 
                      value={settings.general.school_name}
                      onChange={(e) => updateSettings('general', 'school_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academic_year">Ano Letivo</Label>
                    <Input 
                      id="academic_year" 
                      value={settings.general.academic_year}
                      onChange={(e) => updateSettings('general', 'academic_year', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select 
                      value={settings.general.timezone}
                      onValueChange={(value) => updateSettings('general', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">América/São_Paulo</SelectItem>
                        <SelectItem value="America/New_York">América/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europa/Londres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select 
                      value={settings.general.language}
                      onValueChange={(value) => updateSettings('general', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="school" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Instituição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school_name_school">Nome da Escola</Label>
                  <Input 
                    id="school_name_school" 
                    value={settings.school.name}
                    onChange={(e) => updateSettings('school', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input 
                    id="address" 
                    value={settings.school.address}
                    onChange={(e) => updateSettings('school', 'address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={settings.school.phone}
                      onChange={(e) => updateSettings('school', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={settings.school.email}
                      onChange={(e) => updateSettings('school', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={settings.school.website}
                      onChange={(e) => updateSettings('school', 'website', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal">Diretor(a)</Label>
                  <Input 
                    id="principal" 
                    value={settings.school.principal}
                    onChange={(e) => updateSettings('school', 'principal', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprovar professores automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Professores são aprovados automaticamente no registro
                    </p>
                  </div>
                  <Switch 
                    checked={settings.users.auto_approve_teachers}
                    onCheckedChange={(checked) => updateSettings('users', 'auto_approve_teachers', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificação de email obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir verificação de email para novos usuários
                    </p>
                  </div>
                  <Switch 
                    checked={settings.users.require_email_verification}
                    onCheckedChange={(checked) => updateSettings('users', 'require_email_verification', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_policy">Política de Senhas</Label>
                  <Select 
                    value={settings.users.password_policy}
                    onValueChange={(value) => updateSettings('users', 'password_policy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Fraca</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="strong">Forte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações por email
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'email_notifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações via SMS
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'sms_notifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações push no navegador
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'push_notifications', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digest_frequency">Frequência do Resumo</Label>
                  <Select 
                    value={settings.notifications.digest_frequency}
                    onValueChange={(value) => updateSettings('notifications', 'digest_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir segundo fator de autenticação
                    </p>
                  </div>
                  <Switch 
                    checked={settings.security.two_factor_auth}
                    onCheckedChange={(checked) => updateSettings('security', 'two_factor_auth', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logs de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações dos usuários
                    </p>
                  </div>
                  <Switch 
                    checked={settings.security.audit_logs}
                    onCheckedChange={(checked) => updateSettings('security', 'audit_logs', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de Sessão (minutos)</Label>
                  <Input 
                    id="session_timeout" 
                    value={settings.security.session_timeout.toString()}
                    onChange={(e) => updateSettings('security', 'session_timeout', parseInt(e.target.value) || 30)}
                    type="number" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login_attempts">Máximo de Tentativas de Login</Label>
                  <Input 
                    id="login_attempts" 
                    value={settings.security.login_attempts.toString()}
                    onChange={(e) => updateSettings('security', 'login_attempts', parseInt(e.target.value) || 5)}
                    type="number" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Filtrar por usuário..." className="max-w-sm" />
                    <Select defaultValue="all">
                      <SelectTrigger className="max-w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as ações</SelectItem>
                        <SelectItem value="CRIAR">Criar</SelectItem>
                        <SelectItem value="EDITAR">Editar</SelectItem>
                        <SelectItem value="DELETAR">Deletar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action) as any}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.entity}: {log.entityName}</TableCell>
                          <TableCell>{log.details}</TableCell>
                          <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;