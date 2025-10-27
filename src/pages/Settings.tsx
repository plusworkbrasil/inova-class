import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { EmailConfirmationForm } from '@/components/forms/EmailConfirmationForm';
import { BatchResetStudentPasswordsForm } from '@/components/forms/BatchResetStudentPasswordsForm';
import { translateAction, translateTable, getActionBadgeVariant } from '@/lib/auditMappings';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
};

const Settings = () => {
  const { settings, loading, saving, updateSettings, saveSettings } = useSettings();
  const { profile } = useAuth();
  const { logs: auditLogs, loading: logsLoading, fetchLogs } = useAuditLogs();
  
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const handleSaveSettings = async () => {
    await saveSettings(settings);
  };

  const handleFilterChange = () => {
    setCurrentPage(0);
    fetchLogs(0, 50, userFilter, actionFilter);
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleFilterChange, 500);
    return () => clearTimeout(timeoutId);
  }, [userFilter, actionFilter]);

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
                
                {profile?.role && ['admin', 'secretary'].includes(profile.role) && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <h3 className="text-lg font-semibold">Confirmação de Emails</h3>
                    <EmailConfirmationForm />
                  </div>
                )}
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
                      Registrar todas as ações do sistema
                    </p>
                  </div>
                  <Switch 
                    checked={settings.security.audit_logs}
                    onCheckedChange={(checked) => updateSettings('security', 'audit_logs', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout da Sessão (minutos)</Label>
                  <Input 
                    id="session_timeout" 
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSettings('security', 'session_timeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login_attempts">Máximo de Tentativas de Login</Label>
                  <Input 
                    id="login_attempts" 
                    type="number"
                    value={settings.security.login_attempts}
                    onChange={(e) => updateSettings('security', 'login_attempts', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {profile?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Senhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <BatchResetStudentPasswordsForm />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Histórico completo de ações realizadas no sistema
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Filtrar por usuário..." 
                      className="max-w-sm"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    />
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="max-w-sm">
                        <SelectValue placeholder="Filtrar por ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as ações</SelectItem>
                        <SelectItem value="VIEW">Visualizar</SelectItem>
                        <SelectItem value="VIEW_MEDICAL">Visualizar Dados Médicos</SelectItem>
                        <SelectItem value="VIEW_PERSONAL">Visualizar Dados Pessoais</SelectItem>
                        <SelectItem value="UPDATE">Atualizar</SelectItem>
                        <SelectItem value="CREATE">Criar</SelectItem>
                        <SelectItem value="DELETE">Deletar</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Recurso</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Campos Acessados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Nenhum log encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            auditLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium">{log.user_name}</div>
                                    <div className="text-sm text-muted-foreground">{log.user_email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getActionBadgeVariant(log.action)}>
                                    {translateAction(log.action)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>{translateTable(log.table_name)}</div>
                                    {log.record_id && (
                                      <div className="text-xs text-muted-foreground font-mono">
                                        ID: {log.record_id.slice(0, 8)}...
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{formatDateTime(log.created_at)}</TableCell>
                                <TableCell>
                                  {log.ip_address ? (
                                    <span className="font-mono text-sm">{log.ip_address}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {log.accessed_fields && log.accessed_fields.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {log.accessed_fields.slice(0, 3).map((field, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {field}
                                        </Badge>
                                      ))}
                                      {log.accessed_fields.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{log.accessed_fields.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
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