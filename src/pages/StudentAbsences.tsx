import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, Filter, X, Search, TrendingUp, Users, BookOpen, Percent } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useStudentsWithExcessAbsences } from '@/hooks/useStudentsWithExcessAbsences';
import { useActiveClasses } from '@/hooks/useActiveClasses';
import { exportStudentAbsencesToPDF } from '@/lib/studentAbsencesExport';
import { toast } from 'sonner';

const StudentAbsences = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'absences' | 'percentage'>('absences');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, loading, statistics, selectedClassId, filterByClass } = useStudentsWithExcessAbsences();
  const { classes, loading: classesLoading } = useActiveClasses();

  const itemsPerPage = 10;

  // Verificar permissões
  if (!profile || !['admin', 'coordinator', 'tutor'].includes(profile.role || '')) {
    navigate('/');
    return null;
  }

  // Filtrar e ordenar dados
  const filteredData = data.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_enrollment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    if (sortBy === 'name') {
      return multiplier * a.student_name.localeCompare(b.student_name);
    } else if (sortBy === 'absences') {
      return multiplier * (a.total_absences - b.total_absences);
    } else {
      return multiplier * (a.absence_percentage - b.absence_percentage);
    }
  });

  // Paginação
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Funções auxiliares
  const getSeverityBadge = (absences: number) => {
    if (absences >= 10) {
      return <Badge variant="destructive" className="bg-red-500">Crítico ({absences})</Badge>;
    } else if (absences >= 7) {
      return <Badge className="bg-orange-500 text-white">Alerta ({absences})</Badge>;
    } else if (absences >= 4) {
      return <Badge className="bg-yellow-500 text-white">Atenção ({absences})</Badge>;
    } else {
      return <Badge className="bg-blue-500 text-white">Leve ({absences})</Badge>;
    }
  };

  const handleExportPDF = async () => {
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      await exportStudentAbsencesToPDF(sortedData, selectedClass?.name);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleSort = (column: 'name' | 'absences' | 'percentage') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h1 className="text-3xl font-bold">Alunos com Excesso de Faltas</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Lista de alunos com faltas em disciplinas ativas
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {statistics.totalStudents} alunos
          </Badge>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedClassId || 'all'}
                onValueChange={(value) => filterByClass(value === 'all' ? null : value)}
                disabled={classesLoading}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.total_active_subjects} disciplinas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClassId && (
              <Button variant="outline" onClick={() => filterByClass(null)}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtro
              </Button>
            )}
            <Button onClick={handleExportPDF} disabled={sortedData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{statistics.totalStudents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turma com Mais Faltas</p>
                <p className="text-lg font-bold">
                  {statistics.topClass?.name || 'N/A'}
                </p>
                {statistics.topClass && (
                  <p className="text-xs text-muted-foreground">
                    {statistics.topClass.count} alunos
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disciplina com Mais Faltas</p>
                <p className="text-lg font-bold">
                  {statistics.topSubject?.name || 'N/A'}
                </p>
                {statistics.topSubject && (
                  <p className="text-xs text-muted-foreground">
                    {statistics.topSubject.count} registros
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Percent className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Faltas</p>
                <p className="text-2xl font-bold">{statistics.averagePercentage}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Lista de Alunos</h3>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedClassId
                    ? 'Nenhum aluno encontrado com os filtros aplicados'
                    : 'Nenhum aluno com excesso de faltas no momento'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('absences')}
                      >
                        Faltas {sortBy === 'absences' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-center">Total Aulas</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('percentage')}
                      >
                        % Faltas {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((student) => (
                      <TableRow key={`${student.student_id}_${student.subject_id}`}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.student_enrollment}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.subject_name}</TableCell>
                        <TableCell className="text-center">
                          {getSeverityBadge(student.total_absences)}
                        </TableCell>
                        <TableCell className="text-center">{student.total_classes}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {student.absence_percentage}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/student-history?studentId=${student.student_id}`)}
                          >
                            Ver Histórico
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentAbsences;
