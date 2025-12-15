import { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useStudentsAtRisk, StudentAtRisk } from '@/hooks/useStudentsAtRisk';
import { StudentRiskDetailsDialog } from '@/components/ui/student-risk-details-dialog';
import { AddStudentRiskDialog } from '@/components/ui/add-student-risk-dialog';
import { 
  getRiskLevelLabel, 
  getRiskLevelColor, 
  getRiskLevelBadgeVariant,
  getStatusLabel 
} from '@/lib/riskCalculation';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Eye,
  TrendingDown,
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';

const StudentsAtRisk = () => {
  const { data, loading, refetch, resolveRiskRecord } = useStudentsAtRisk();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [selectedRecord, setSelectedRecord] = useState<StudentAtRisk | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const active = data.filter(r => r.status === 'active' || r.status === 'monitoring');
    return {
      critical: active.filter(r => r.risk_level === 'critical').length,
      high: active.filter(r => r.risk_level === 'high').length,
      medium: active.filter(r => r.risk_level === 'medium').length,
      resolved: data.filter(r => r.status === 'resolved').length,
      evaded: data.filter(r => r.status === 'evaded').length,
      total: active.length
    };
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter(record => {
      // Search filter
      const matchesSearch = !searchTerm || 
        record.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_class?.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Risk level filter
      const matchesRiskLevel = filterRiskLevel === 'all' || record.risk_level === filterRiskLevel;

      // Status filter
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && (record.status === 'active' || record.status === 'monitoring')) ||
        record.status === filterStatus;

      return matchesSearch && matchesRiskLevel && matchesStatus;
    });
  }, [data, searchTerm, filterRiskLevel, filterStatus]);

  const handleViewDetails = (record: StudentAtRisk) => {
    setSelectedRecord(record);
    setShowDetailsDialog(true);
  };

  const existingStudentIds = useMemo(() => 
    data.filter(r => r.status === 'active' || r.status === 'monitoring').map(r => r.student_id),
    [data]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Alunos em Risco de Evasão
            </h1>
            <p className="text-muted-foreground">
              Acompanhamento preventivo e intervenções para evitar evasão escolar
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">Crítico</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
              <p className="text-xs text-muted-foreground mt-1">Alto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
              <p className="text-xs text-muted-foreground mt-1">Médio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Resolvidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-muted-foreground">{stats.evaded}</div>
              <p className="text-xs text-muted-foreground mt-1">Evadidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou turma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Nível de Risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="monitoring">Monitoramento</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="evaded">Evadidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Alunos em Acompanhamento</span>
              <Badge variant="outline">{filteredData.length} registros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
                ))}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredData.map((record) => (
                    <Card key={record.id} className="hover:bg-muted/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant={getRiskLevelBadgeVariant(record.risk_level)}>
                                {getRiskLevelLabel(record.risk_level)}
                              </Badge>
                              <span className="font-medium">{record.student?.name || 'Aluno'}</span>
                              <span className="text-sm text-muted-foreground">
                                {record.student_class?.name || 'Sem turma'}
                              </span>
                              {record.status !== 'active' && (
                                <Badge variant="outline">{getStatusLabel(record.status)}</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">Risco:</span>
                                <div className="w-24">
                                  <Progress value={record.risk_score} className="h-2" />
                                </div>
                                <span className={`font-medium ${getRiskLevelColor(record.risk_level)}`}>
                                  {record.risk_score}/100
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <TrendingDown className={`h-4 w-4 ${(record.attendance_percentage || 0) < 75 ? 'text-red-500' : 'text-green-500'}`} />
                                <span>{(record.attendance_percentage || 0).toFixed(0)}%</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className={`h-4 w-4 ${(record.grade_average || 0) < 5 ? 'text-red-500' : 'text-green-500'}`} />
                                <span>{(record.grade_average || 0).toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Identificado {formatDistanceToNow(new Date(record.identified_at), { addSuffix: true, locale: ptBR })}
                              </span>
                              {record.interventions_count > 0 && (
                                <span>
                                  {record.interventions_count} intervenção(ões)
                                </span>
                              )}
                              {record.last_intervention && (
                                <span>
                                  Última: {formatDistanceToNow(new Date(record.last_intervention), { addSuffix: true, locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(record)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <StudentRiskDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          riskRecord={selectedRecord}
          onResolve={resolveRiskRecord}
        />

        <AddStudentRiskDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={refetch}
          existingStudentIds={existingStudentIds}
        />
      </div>
    </Layout>
  );
};

export default StudentsAtRisk;
