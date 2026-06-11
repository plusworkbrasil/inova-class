import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, School, Bell, Shield, Save, FileText, Loader2, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useToast } from '@/hooks/use-toast';
import { EmailConfirmationForm } from '@/components/forms/EmailConfirmationForm';
import { BatchResetStudentPasswordsForm } from '@/components/forms/BatchResetStudentPasswordsForm';
import { ResetSpecificPasswordsForm } from '@/components/forms/ResetSpecificPasswordsForm';
import { DiagnoseAuthForm } from '@/components/forms/DiagnoseAuthForm';
import { SyncAuthEmailsForm } from '@/components/forms/SyncAuthEmailsForm';
import { translateAction, translateTable, getActionBadgeVariant } from '@/lib/auditMappings';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
};

const Settings = () => {
  const { settings, loading, saving, updateSettings, saveSettings } = useSettings();
  const { profile } = useAuth();
  const { logs: auditLogs, loading: logsLoading, totalCount, isLive, fetchLogs, refreshLogs } = useAuditLogs();

  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('__all__');
  const [tableFilter, setTableFilter] = useState('__all__');
  const [periodFilter, setPeriodFilter] = useState('7d');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    await saveSettings(settings);
  };

  const computeStartDate = (period: string): string | undefined => {
    if (period === 'all') return undefined;
    const d = new Date();
    if (period === '24h') d.setHours(d.getHours() - 24);
    else if (period === '7d') d.setDate(d.getDate() - 7);
    else if (period === '30d') d.setDate(d.getDate() - 30);
    return d.toISOString();
  };

  const applyFilters = (page = 0) => {
    setCurrentPage(page);
    fetchLogs(page, pageSize, {
      userQuery: userFilter,
      action: actionFilter,
      tableName: tableFilter,
      startDate: computeStartDate(periodFilter),
    });
  };

  useEffect(() => {
    const t = setTimeout(() => applyFilters(0), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilter, actionFilter, tableFilter, periodFilter, pageSize]);

  const summary = {
    created: auditLogs.filter((l) => l.action === 'RECORD_CREATED').length,
    updated: auditLogs.filter((l) => l.action === 'RECORD_UPDATED').length,
    deleted: auditLogs.filter((l) => l.action === 'RECORD_DELETED').length,
    logins: auditLogs.filter((l) => l.action === 'LOGIN').length,
  };

  const exportCsv = () => {
    const header = ['Data', 'Usuário', 'Email', 'Papel', 'Ação', 'Tabela', 'ID', 'Campos', 'IP'];
    const rows = auditLogs.map((l) => [
      new Date(l.created_at).toLocaleString('pt-BR'),
      l.user_name,
      l.user_email,
      l.user_role,
      translateAction(l.action),
      translateTable(l.table_name),
      l.record_id || '',
      (l.accessed_fields || []).join('; '),
      l.ip_address || '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnóstico de Autenticação</CardTitle>
                    <CardDescription>
                      Verifique se os emails em profiles estão sincronizados com auth.users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DiagnoseAuthForm />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Redefinir Senhas Específicas</CardTitle>
                    <CardDescription>
                      Redefina as senhas de usuários específicos com problemas de credenciais (usa ID da tabela profiles)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResetSpecificPasswordsForm />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sincronizar Emails Auth ↔ Profiles</CardTitle>
                    <CardDescription>
                      Sincronize emails desalinhados entre auth.users e profiles (pode exigir reconfirmação de email)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SyncAuthEmailsForm />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gerenciamento de Senhas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BatchResetStudentPasswordsForm />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Logs de Auditoria
                      <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            isLive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'
                          }`}
                        />
                        {isLive ? 'Ao vivo' : 'Conectando...'}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Histórico em tempo real de todas as ações realizadas no sistema
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshLogs()}>
                      Atualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Criados (página)</div>
                    <div className="text-2xl font-bold text-green-600">{summary.created}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Atualizados (página)</div>
                    <div className="text-2xl font-bold text-blue-600">{summary.updated}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Deletados (página)</div>
                    <div className="text-2xl font-bold text-red-600">{summary.deleted}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Logins (página)</div>
                    <div className="text-2xl font-bold">{summary.logins}</div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                  <Input
                    placeholder="Buscar usuário (nome/email)..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  />
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas as ações</SelectItem>
                      <SelectItem value="RECORD_CREATED">Registro criado</SelectItem>
                      <SelectItem value="RECORD_UPDATED">Registro atualizado</SelectItem>
                      <SelectItem value="RECORD_DELETED">Registro deletado</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="UNAUTHORIZED_ACCESS_ATTEMPT">Acesso não autorizado</SelectItem>
                      <SelectItem value="ACCOUNT_AUTO_BLOCKED">Conta bloqueada</SelectItem>
                      <SelectItem value="ACCOUNT_UNBLOCKED">Conta desbloqueada</SelectItem>
                      <SelectItem value="UPDATE_PASSWORD">Atualização de senha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger><SelectValue placeholder="Recurso" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos os recursos</SelectItem>
                      <SelectItem value="profiles">Usuários</SelectItem>
                      <SelectItem value="classes">Turmas</SelectItem>
                      <SelectItem value="subjects">Disciplinas</SelectItem>
                      <SelectItem value="attendance">Frequência</SelectItem>
                      <SelectItem value="grades">Notas</SelectItem>
                      <SelectItem value="declarations">Declarações</SelectItem>
                      <SelectItem value="evasions">Evasões</SelectItem>
                      <SelectItem value="equipment">Equipamentos</SelectItem>
                      <SelectItem value="equipment_allocations">Alocações</SelectItem>
                      <SelectItem value="communications">Comunicações</SelectItem>
                      <SelectItem value="notifications">Notificações</SelectItem>
                      <SelectItem value="user_roles">Papéis</SelectItem>
                      <SelectItem value="auth">Autenticação</SelectItem>
                      <SelectItem value="system_settings">Configurações</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Últimas 24 horas</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="all">Todo o histórico</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Por página" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Campos afetados</TableHead>
                          <TableHead>IP</TableHead>
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
                            <React.Fragment key={log.id}>
                              <TableRow
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                              >
                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                  {formatDateTime(log.created_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <div className="font-medium text-sm">{log.user_name}</div>
                                    <div className="text-xs text-muted-foreground">{log.user_email}</div>
                                    {log.user_role && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        {log.user_role}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getActionBadgeVariant(log.action)}>
                                    {translateAction(log.action)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <div className="text-sm">{translateTable(log.table_name)}</div>
                                    {log.record_id && (
                                      <div className="text-[10px] text-muted-foreground font-mono">
                                        {log.record_id.slice(0, 8)}...
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {log.accessed_fields && log.accessed_fields.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                      {log.accessed_fields.slice(0, 3).map((f, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                                      ))}
                                      {log.accessed_fields.length > 3 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          +{log.accessed_fields.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {log.ip_address || <span className="text-muted-foreground">-</span>}
                                </TableCell>
                              </TableRow>
                              {expanded === log.id && (
                                <TableRow>
                                  <TableCell colSpan={6} className="bg-muted/30">
                                    <div className="p-3 space-y-2 text-sm">
                                      <div><span className="font-semibold">ID do registro:</span> <span className="font-mono text-xs">{log.record_id || '—'}</span></div>
                                      <div><span className="font-semibold">User Agent:</span> <span className="text-xs text-muted-foreground">{log.user_agent || '—'}</span></div>
                                      <div>
                                        <span className="font-semibold">Todos os campos:</span>{' '}
                                        {log.accessed_fields && log.accessed_fields.length > 0 ? (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {log.accessed_fields.map((f, i) => (
                                              <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                                            ))}
                                          </div>
                                        ) : '—'}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Paginação */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {totalCount} registro(s) · Página {currentPage + 1} de {Math.max(1, Math.ceil(totalCount / pageSize))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => applyFilters(currentPage - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(currentPage + 1) * pageSize >= totalCount}
                      onClick={() => applyFilters(currentPage + 1)}
                    >
                      Próxima
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