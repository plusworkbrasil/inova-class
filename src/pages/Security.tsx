import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, AlertTriangle, Eye, Search, Filter } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { translateAction, translateTable, getActionBadgeVariant } from '@/lib/auditMappings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Security() {
  const { profile } = useAuth();
  const { logs, loading, totalCount, fetchLogs } = useAuditLogs();
  const [currentPage, setCurrentPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const pageSize = 20;

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('Acesso negado: Apenas administradores podem acessar esta página');
      return;
    }
    fetchLogs(currentPage, pageSize, userFilter, actionFilter);
  }, [currentPage, userFilter, actionFilter, profile?.role]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1, pageSize, userFilter, actionFilter);
  };

  const handleClearFilters = () => {
    setUserFilter('');
    setActionFilter('');
    setCurrentPage(1);
    fetchLogs(1, pageSize);
  };

  if (profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
                <p className="text-muted-foreground">
                  Apenas administradores podem acessar o painel de segurança.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Painel de Segurança</h1>
            <p className="text-muted-foreground">
              Monitore atividades e logs de auditoria do sistema
            </p>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Logs
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">
                registros de auditoria
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ações Sensíveis
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('MEDICAL') || log.action.includes('PERSONAL')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                acessos a dados médicos/pessoais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(logs.map(log => log.user_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                usuários com atividade
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Auditoria
            </CardTitle>
            <CardDescription>
              Filtre os logs por usuário ou tipo de ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="userFilter" className="text-sm font-medium">
                  Filtrar por usuário
                </label>
                <Input
                  id="userFilter"
                  placeholder="Nome ou email do usuário..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="actionFilter" className="text-sm font-medium">
                  Filtrar por ação
                </label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma ação..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as ações</SelectItem>
                    <SelectItem value="VIEW_MEDICAL">Visualizar Dados Médicos</SelectItem>
                    <SelectItem value="VIEW_PERSONAL">Visualizar Dados Pessoais</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="UPDATE">Atualizar</SelectItem>
                    <SelectItem value="CREATE">Criar</SelectItem>
                    <SelectItem value="DELETE">Deletar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Histórico detalhado de todas as atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Campos Acessados</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user_name || 'Usuário desconhecido'}</div>
                            <div className="text-sm text-muted-foreground">{log.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {translateAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {translateTable(log.table_name)}
                        </TableCell>
                        <TableCell>
                          {log.accessed_fields && log.accessed_fields.length > 0 ? (
                            <div className="text-sm">
                              {log.accessed_fields.slice(0, 3).map((field, index) => (
                                <Badge key={index} variant="outline" className="mr-1 mb-1">
                                  {field}
                                </Badge>
                              ))}
                              {log.accessed_fields.length > 3 && (
                                <Badge variant="outline">
                                  +{log.accessed_fields.length - 3} mais
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip_address || <span className="text-muted-foreground">N/A</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({totalCount} registros)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}