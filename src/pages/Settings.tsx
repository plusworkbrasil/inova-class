import { useState } from 'react';
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
import { Settings as SettingsIcon, User, School, Bell, Shield, Save, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
  // Estados para configurações gerais
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Inova Class',
    description: 'Sistema acadêmico para gestão escolar completa',
    timezone: 'america-saopaulo',
    language: 'pt-br',
  });

  // Estados para configurações da escola
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'Escola Estadual Exemplo',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 1234-5678',
    email: 'contato@escola.edu.br',
    website: 'www.escola.edu.br',
    schoolYear: '2024',
    maxAbsences: '25',
    minGrade: '6.0',
    maxGrade: '10.0',
  });

  // Estados para configurações de usuários
  const [userSettings, setUserSettings] = useState({
    allowAutoRegister: false,
    requireEmailVerification: true,
    strongPasswordPolicy: true,
    sessionTimeout: '60',
  });

  // Estados para notificações
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
  });

  // Estados para configurações de segurança
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    auditLog: true,
    maxLoginAttempts: '5',
    lockoutTime: '15',
  });

  // Mock data para logs de auditoria
  const auditLogs = [
    {
      id: 1,
      timestamp: new Date('2024-01-15T10:30:00'),
      user: 'Admin',
      action: 'CRIAR',
      entity: 'Usuário',
      entityName: 'João Silva',
      details: 'Criou novo usuário com perfil Professor',
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
      user: 'Secretário Pedro',
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
    // Aqui você salvaria as configurações no backend
    toast({
      title: "Configurações salvas com sucesso!",
      description: "Todas as alterações foram aplicadas.",
    });
  };

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <Button className="flex items-center gap-2" onClick={handleSaveSettings}>
            <Save size={16} />
            Salvar Alterações
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
                    <Label htmlFor="systemName">Nome do Sistema</Label>
                    <Input 
                      id="systemName" 
                      value={generalSettings.systemName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Versão</Label>
                    <Input id="version" defaultValue="1.0.0" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Sistema</Label>
                  <Textarea 
                    id="description" 
                    value={generalSettings.description}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select 
                      value={generalSettings.timezone}
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america-saopaulo">América/São_Paulo</SelectItem>
                        <SelectItem value="america-newyork">América/New_York</SelectItem>
                        <SelectItem value="europe-london">Europa/Londres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select 
                      value={generalSettings.language}
                      onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                        <SelectItem value="en-us">English (US)</SelectItem>
                        <SelectItem value="es-es">Español</SelectItem>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Nome da Escola</Label>
                    <Input 
                      id="schoolName" 
                      value={schoolSettings.schoolName}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input 
                      id="cnpj" 
                      value={schoolSettings.cnpj}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input 
                    id="address" 
                    value={schoolSettings.address}
                    onChange={(e) => setSchoolSettings(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={schoolSettings.phone}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={schoolSettings.email}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={schoolSettings.website}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Acadêmicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolYear">Ano Letivo</Label>
                    <Input 
                      id="schoolYear" 
                      value={schoolSettings.schoolYear}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, schoolYear: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAbsences">Máximo de Faltas (%)</Label>
                    <Input 
                      id="maxAbsences" 
                      value={schoolSettings.maxAbsences}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, maxAbsences: e.target.value }))}
                      type="number" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minGrade">Nota Mínima para Aprovação</Label>
                    <Input 
                      id="minGrade" 
                      value={schoolSettings.minGrade}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, minGrade: e.target.value }))}
                      type="number" 
                      step="0.1" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGrade">Nota Máxima</Label>
                    <Input 
                      id="maxGrade" 
                      value={schoolSettings.maxGrade}
                      onChange={(e) => setSchoolSettings(prev => ({ ...prev, maxGrade: e.target.value }))}
                      type="number" 
                      step="0.1" 
                    />
                  </div>
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
                    <Label>Permitir auto-registro</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários podem se registrar automaticamente
                    </p>
                  </div>
                  <Switch 
                    checked={userSettings.allowAutoRegister}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, allowAutoRegister: checked }))
                    }
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
                    checked={userSettings.requireEmailVerification}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Política de senha forte</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir senhas com pelo menos 8 caracteres
                    </p>
                  </div>
                  <Switch 
                    checked={userSettings.strongPasswordPolicy}
                    onCheckedChange={(checked) => 
                      setUserSettings(prev => ({ ...prev, strongPasswordPolicy: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                  <Input 
                    id="sessionTimeout" 
                    value={userSettings.sessionTimeout}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                    type="number" 
                  />
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
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
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
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações por SMS
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.sms}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, sms: checked }))
                    }
                  />
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
                      Ativar 2FA para administradores
                    </p>
                  </div>
                  <Switch 
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações do sistema
                    </p>
                  </div>
                  <Switch 
                    checked={securitySettings.auditLog}
                    onCheckedChange={(checked) => 
                      setSecuritySettings(prev => ({ ...prev, auditLog: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                  <Input 
                    id="maxLoginAttempts" 
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                    type="number" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutTime">Tempo de Bloqueio (minutos)</Label>
                  <Input 
                    id="lockoutTime" 
                    value={securitySettings.lockoutTime}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutTime: e.target.value }))}
                    type="number" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Logs de Auditoria
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Histórico completo de todas as ações realizadas no sistema
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-4">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as ações</SelectItem>
                        <SelectItem value="CRIAR">Criar</SelectItem>
                        <SelectItem value="EDITAR">Editar</SelectItem>
                        <SelectItem value="DELETAR">Deletar</SelectItem>
                        <SelectItem value="CONFIGURAR">Configurar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="today">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mês</SelectItem>
                        <SelectItem value="all">Todo período</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar size={16} />
                    Exportar Logs
                  </Button>
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
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.user}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.entity}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.entityName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground truncate">
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {auditLogs.length} registros
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm">
                      Próximo
                    </Button>
                  </div>
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