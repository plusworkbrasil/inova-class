import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Search, Plus, Edit, UserX, Calendar, AlertTriangle, Users, CalendarIcon, X, Check, FileDown } from 'lucide-react';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { AttendanceViewDialog } from '@/components/ui/attendance-view-dialog';
import { AttendanceEditForm } from '@/components/forms/AttendanceEditForm';
import { AttendanceGroupDetailsDialog } from '@/components/ui/attendance-group-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useInstructorClasses } from '@/hooks/useInstructorClasses';
import { useInstructorSubjects } from '@/hooks/useInstructorSubjects';
import { useSupabaseAttendance, type Attendance, type GroupedAttendance, type AttendanceFilters } from '@/hooks/useSupabaseAttendance';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toBrasiliaDate, formatDateBR, getTodayInBrasilia, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const Attendance = () => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedAttendance | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const attendanceFilters: AttendanceFilters = {
    class_id: selectedClass || undefined,
    subject_id: selectedSubject || undefined,
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  };

  const { 
    data: attendanceData, 
    loading: attendanceLoading, 
    createAttendance, 
    updateAttendance, 
    deleteBatchAttendance,
    updateBatchAttendance,
    refetch,
    createBatchAttendance,
    checkDuplicateAttendance,
    getGroupedAttendance
  } = useSupabaseAttendance(attendanceFilters);
  const { data: classes } = useSupabaseClasses();
  const { data: subjects } = useSupabaseSubjects();
  const { classes: instructorClasses } = useInstructorClasses();
  const { subjects: instructorSubjects } = useInstructorSubjects();

  useEffect(() => {
    if (profile) {
      setUserRole(profile.role as UserRole);
      setUserName(profile.name);
    }
  }, [profile]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedSubject, startDate, endDate]);

  const handleOpenAttendanceForm = () => {
    // Para instrutores, verificar se tem subjects antes de abrir
    if (userRole === 'instructor') {
      const hasClasses = instructorClasses && instructorClasses.length > 0;
      const hasSubjects = instructorSubjects && instructorSubjects.length > 0;
      
      console.log('📋 Abrindo formulário de frequência:', {
        role: profile?.role,
        userId: user?.id,
        classesCount: instructorClasses?.length || 0,
        subjectsCount: instructorSubjects?.length || 0,
        hasClasses,
        hasSubjects,
      });

      if (!hasClasses && !hasSubjects) {
        toast({
          variant: "destructive",
          title: "Sem permissões",
          description: "Você não tem turmas ou disciplinas atribuídas. Contate o administrador.",
        });
        return;
      }
    }
    
    setIsAttendanceFormOpen(true);
  };

  const handleAttendanceSubmit = async (data: any) => {
    try {
      const brasiliaDate = toBrasiliaDate(data.date);
      
      // Verificar duplicação
      const isDuplicate = await checkDuplicateAttendance(
        data.classId,
        data.subjectId,
        brasiliaDate
      );
      
      if (isDuplicate) {
        toast({
          variant: "destructive",
          title: "Frequência já registrada!",
          description: "Já existe uma frequência registrada para esta turma, disciplina e data. Use 'Alterar Frequência' para modificar.",
        });
        return;
      }
      
      // Preparar registros em lote
      const attendanceRecords = data.attendance.map((student: any) => ({
        student_id: student.studentId,
        class_id: data.classId,
        subject_id: data.subjectId,
        date: brasiliaDate,
        is_present: student.isPresent,
        justification: student.isPresent ? null : 'Falta não justificada'
      }));
      
      // Salvar em lote
      await createBatchAttendance(attendanceRecords, data.dailyActivity);
      
      toast({
        title: "✅ Frequência registrada com sucesso!",
        description: `Frequência registrada para ${data.attendance.length} alunos.`,
      });
      
      setIsAttendanceFormOpen(false);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar frequência",
        description: "Ocorreu um erro ao salvar a frequência.",
      });
    }
  };

  const handleViewAttendance = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setViewDialogOpen(true);
  };

  const handleEditAttendance = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setEditDialogOpen(true);
  };

  const handleUpdateAttendance = async (id: string, updates: Partial<Attendance>) => {
    try {
      await updateAttendance(id, updates);
      toast({
        title: "Frequência atualizada!",
        description: "O registro foi atualizado com sucesso.",
      });
      setEditDialogOpen(false);
      setGroupDetailsOpen(false);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a frequência.",
      });
    }
  };

  const handleViewGroupDetails = (group: GroupedAttendance) => {
    setSelectedGroup(group);
    setGroupDetailsOpen(true);
  };

  const handleDeleteGroup = async (group: GroupedAttendance) => {
    try {
      const recordIds = group.records.map(r => r.id);
      await deleteBatchAttendance(recordIds);
      setGroupDetailsOpen(false);
      refetch();
    } catch (error) {
      console.error('Error deleting attendance group:', error);
    }
  };

  const handleEditFromGroup = (attendanceId: string) => {
    const attendance = attendanceData.find(a => a.id === attendanceId);
    if (attendance) {
      handleEditAttendance(attendance);
    }
  };

  const handleBatchUpdateAttendance = async (
    updates: Array<{ id: string; updates: Partial<Attendance> }>
  ) => {
    try {
      await updateBatchAttendance(updates);
      toast({
        title: "Alterações salvas!",
        description: `${updates.length} registro(s) atualizado(s) com sucesso.`,
      });
      setGroupDetailsOpen(false);
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar alterações",
        description: "Ocorreu um erro ao atualizar os registros.",
      });
    }
  };

  // Calcular estatísticas dos dados reais
  const getAttendanceStats = () => {
    if (userRole === 'student') {
      const userAttendance = attendanceData.filter(record => record.student_id === user?.id);
      const presentCount = userAttendance.filter(record => record.is_present).length;
      const absentCount = userAttendance.filter(record => !record.is_present).length;
      const totalRecords = userAttendance.length;
      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
      
      return {
        present: presentCount,
        absent: absentCount,
        rate: attendanceRate,
        total: absentCount
      };
    } else {
      // Para admins/instrutores - dados gerais do dia atual
      const today = getTodayInBrasilia();
      const todayRecords = attendanceData.filter(record => record.date === today);
      const presentCount = todayRecords.filter(record => record.is_present).length;
      const absentCount = todayRecords.filter(record => !record.is_present).length;
      const totalRecords = attendanceData.length;
      const attendanceRate = totalRecords > 0 ? Math.round((attendanceData.filter(r => r.is_present).length / totalRecords) * 100) : 0;
      
      // Alunos com mais de 3 faltas (simulação - seria necessário uma query mais complexa)
      const studentsWithManyAbsences = 8; // Placeholder
      
      return {
        present: presentCount,
        absent: absentCount,
        rate: attendanceRate,
        total: studentsWithManyAbsences
      };
    }
  };

  const stats = getAttendanceStats();

  const getStatusBadge = (status: string) => {
    return status === 'presente' 
      ? <Badge variant="default">Presente</Badge>
      : <Badge variant="destructive">Falta</Badge>;
  };

  const getAbsencesBadge = (absences: number) => {
    if (absences >= 3) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle size={12} />
        {absences}
      </Badge>;
    }
    return <Badge variant="outline">{absences}</Badge>;
  };

  // Filtrar dados para o usuário atual
  const getFilteredData = () => {
    let filtered = attendanceData;
    
    if (userRole === 'student') {
      filtered = attendanceData.filter(record => record.student_id === user?.id);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Só filtrar se não for "all"
    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter(record => record.class_id === selectedClass);
    }
    
    // Só filtrar se não for "all"
    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(record => record.subject_id === selectedSubject);
    }
    
    if (startDate) {
      const startStr = format(startDate, 'yyyy-MM-dd');
      filtered = filtered.filter(record => record.date >= startStr);
    }
    
    if (endDate) {
      const endStr = format(endDate, 'yyyy-MM-dd');
      filtered = filtered.filter(record => record.date <= endStr);
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedSubject('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const filteredRecords = getFilteredData();
  const getFilteredGroupedRecords = () => {
    // Usar getGroupedAttendance() que já inclui class_name, subject_name e estatísticas
    const baseGroups = getGroupedAttendance();
    
    // Aplicar filtros sobre os grupos
    let filteredGroups = baseGroups;
    
    if (selectedClass && selectedClass !== 'all') {
      filteredGroups = filteredGroups.filter(group => group.class_id === selectedClass);
    }
    
    if (selectedSubject && selectedSubject !== 'all') {
      filteredGroups = filteredGroups.filter(group => group.subject_id === selectedSubject);
    }
    
    if (startDate) {
      const startStr = format(startDate, 'yyyy-MM-dd');
      filteredGroups = filteredGroups.filter(group => group.date >= startStr);
    }
    
    if (endDate) {
      const endStr = format(endDate, 'yyyy-MM-dd');
      filteredGroups = filteredGroups.filter(group => group.date <= endStr);
    }
    
    return filteredGroups;
  };

  const groupedRecords = userRole !== 'student' ? getFilteredGroupedRecords() : [];

  // Pagination logic
  const totalItems = userRole === 'student' ? filteredRecords.length : groupedRecords.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudentRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const paginatedGroupedRecords = groupedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} de {totalItems} registros
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page as number)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'student' ? 'Minha Frequência' : 'Controle de Frequência'}
          </h1>
          {userRole !== 'student' && (
            <Button 
              className="flex items-center gap-2"
              onClick={handleOpenAttendanceForm}
            >
              <Plus size={16} />
              Registrar Frequência
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Minhas Presenças' : 'Presentes Hoje'}
                  </p>
                  <p className="text-3xl font-bold text-success">
                    {attendanceLoading ? '...' : stats.present}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Minhas Faltas' : 'Faltas Hoje'}
                  </p>
                  <p className="text-3xl font-bold text-destructive">
                    {attendanceLoading ? '...' : stats.absent}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Minha Frequência' : '% Frequência'}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {attendanceLoading ? '...' : `${stats.rate}%`}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {userRole === 'student' ? 'Total de Faltas' : 'Alunos com +3 Faltas'}
                  </p>
                  <p className="text-3xl font-bold text-warning">
                    {attendanceLoading ? '...' : stats.total}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {userRole !== 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(searchTerm || selectedClass || selectedSubject || startDate || endDate) && (
                <div className="mt-4 flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'student' ? 'Meu Histórico de Frequência' : 'Registro de Frequência'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userRole === 'student' ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Justificativa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Carregando registros de frequência...
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Nenhum registro de frequência encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.class_name || 'Turma não encontrada'}</TableCell>
                          <TableCell>{formatDateBR(record.date)}</TableCell>
                          <TableCell>{record.subject_name || 'Disciplina não encontrada'}</TableCell>
                          <TableCell>{getStatusBadge(record.is_present ? 'presente' : 'falta')}</TableCell>
                          <TableCell>
                            {record.justification ? (
                              (() => {
                                const docMatch = record.justification.match(/\[doc:(.+?)\]/);
                                if (docMatch) {
                                  const filePath = docMatch[1];
                                  const { data: urlData } = supabase.storage
                                    .from('declarations')
                                    .getPublicUrl(filePath);
                                  return (
                                    <div className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        Justificada
                                      </Badge>
                                      <a
                                        href={urlData.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Ver documento"
                                      >
                                        <FileDown className="h-4 w-4 text-primary hover:text-primary/80" />
                                      </a>
                                    </div>
                                  );
                                }
                                return (
                                  <Badge variant="outline" title={record.justification}>
                                    {record.justification.includes('justificada') ? 'Justificada' : 'Com justificativa'}
                                  </Badge>
                                );
                              })()
                            ) : (
                              <Badge variant="outline">-</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {renderPagination()}
              </>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-center">Estatísticas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Carregando registros de frequência...
                        </TableCell>
                      </TableRow>
                    ) : groupedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          {userRole === 'instructor' ? (
                            <div className="py-4">
                              <p className="text-muted-foreground">
                                Nenhum registro visível para você.
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Se você acabou de registrar uma frequência e ela não aparece, verifique se você está vinculado à disciplina correspondente.
                              </p>
                            </div>
                          ) : (
                            'Nenhum registro de frequência encontrado.'
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedGroupedRecords.map((group) => (
                        <TableRow key={`${group.date}-${group.subject_id}-${group.class_id}`}>
                          <TableCell>{formatDateBR(group.date)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{group.class_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{group.subject_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <Users size={12} className="mr-1" />
                                  Total: {group.total_students}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  <Check size={12} className="mr-1" />
                                  {group.present_count}
                                </Badge>
                                <Badge variant="destructive" className="text-xs">
                                  <X size={12} className="mr-1" />
                                  {group.absent_count}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewGroupDetails(group)}
                            >
                              <Users size={14} className="mr-1" />
                              Ver Alunos
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>
        
        {userRole !== 'student' && (
          <>
            <AttendanceForm
              open={isAttendanceFormOpen}
              onOpenChange={setIsAttendanceFormOpen}
              onSubmit={handleAttendanceSubmit}
            />
            
            <AttendanceViewDialog
              open={viewDialogOpen}
              onOpenChange={setViewDialogOpen}
              attendance={selectedAttendance}
            />
            
            <AttendanceEditForm
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              attendance={selectedAttendance}
              onSave={handleUpdateAttendance}
            />
            
            <AttendanceGroupDetailsDialog
              open={groupDetailsOpen}
              onOpenChange={setGroupDetailsOpen}
              group={selectedGroup}
              onEdit={handleEditFromGroup}
              onDelete={handleDeleteGroup}
              onBatchUpdate={handleBatchUpdateAttendance}
              userRole={profile?.role}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;