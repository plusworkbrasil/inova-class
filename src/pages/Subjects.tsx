import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, BookOpen, Clock, User, Calendar, AlertTriangle, FileSpreadsheet, FileBarChart, ClipboardList, CalendarDays } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { SubjectForm } from '@/components/forms/SubjectForm';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useInstructors } from '@/hooks/useInstructors';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useRealClassData } from '@/hooks/useRealClassData';
import { cn, toBrasiliaDate, parseYMDToLocalDate, formatDateBR } from '@/lib/utils';
import { SubjectAttendanceExportDialog } from '@/components/ui/subject-attendance-export-dialog';
import { SubjectGradesExportDialog } from '@/components/ui/subject-grades-export-dialog';
import { exportAttendanceSignatureSheet, exportWeeklyFrequencySheet } from '@/lib/attendanceExport';
import { supabase } from '@/integrations/supabase/client';

const Subjects = () => {
  const { profile } = useAuth();
  const userRole = (profile?.role || 'admin') as UserRole;
  const userName = profile?.name || 'Admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedSubjectForExport, setSelectedSubjectForExport] = useState<{
    id: string;
    name: string;
    class_id: string;
    class_name: string;
  } | null>(null);
  const [gradesExportDialogOpen, setGradesExportDialogOpen] = useState(false);
  const [selectedSubjectForGradesExport, setSelectedSubjectForGradesExport] = useState<{
    id: string;
    name: string;
    class_id: string;
    class_name: string;
  } | null>(null);
  const { toast } = useToast();

  // Use Supabase hooks
  const { data: subjects, loading, createSubject, updateSubject, deleteSubject } = useSupabaseSubjects();
  const { instructors } = useInstructors();
  const { data: classes } = useSupabaseClasses();
  const { stats: classStats } = useRealClassData();

  // Helper functions to get names from IDs
  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return 'Não atribuído';
    const teacher = instructors.find(instructor => instructor.id === teacherId);
    return teacher?.name || 'Não encontrado';
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return 'Sem turma';
    const classItem = classes.find(cls => cls.id === classId);
    return classItem?.name || 'Não encontrada';
  };

  // Função para agrupar disciplinas por turma
  const getSubjectsByClass = () => {
    const subjectsByClass: Record<string, any[]> = {};
    
    filteredSubjects.forEach(subject => {
      const className = getClassName(subject.class_id);
      if (!subjectsByClass[className]) {
        subjectsByClass[className] = [];
      }
      subjectsByClass[className].push(subject);
    });
    
    return subjectsByClass;
  };

  // Função para verificar se a disciplina está ativa no momento
  const isSubjectActive = (subject: any) => {
    const now = new Date();
    const startDate = (subject as any).start_date ? parseYMDToLocalDate((subject as any).start_date) : null;
    const endDate = (subject as any).end_date ? parseYMDToLocalDate((subject as any).end_date) : null;
    
    if (!startDate && !endDate) return subject.status === 'ativo';
    if (!startDate) return now <= endDate && subject.status === 'ativo';
    if (!endDate) return now >= startDate && subject.status === 'ativo';
    
    return now >= startDate && now <= endDate && subject.status === 'ativo';
  };

  // Função para verificar se a disciplina termina em 5 dias ou menos
  const isSubjectEndingSoon = (subject: any) => {
    if (!isSubjectActive(subject)) return false;
    
    const endDate = (subject as any).end_date ? parseYMDToLocalDate((subject as any).end_date) : null;
    if (!endDate) return false;
    
    const now = new Date();
    const daysUntilEnd = differenceInDays(endDate, now);
    
    return daysUntilEnd >= 0 && daysUntilEnd <= 5;
  };

  const handleCreateSubject = async (data: any) => {
    try {
      const subjectData: any = {
        name: data.name,
        code: data.code,
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        workload: data.workload,
        description: data.description,
        status: data.status,
      };

    if (data.start_date) {
      subjectData.start_date = toBrasiliaDate(data.start_date);
    }
    if (data.end_date) {
      subjectData.end_date = toBrasiliaDate(data.end_date);
    }

      await createSubject(subjectData);
      
      toast({
        title: "Disciplina criada com sucesso!",
        description: `A disciplina ${data.name} foi criada.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditSubject = async (subjectData: any) => {
    if (!editingSubject) return;
    
    try {
      const updateData: any = {
        name: subjectData.name,
        code: subjectData.code,
        teacher_id: subjectData.teacher_id,
        class_id: subjectData.class_id,
        workload: subjectData.workload,
        description: subjectData.description,
        status: subjectData.status,
      };

    if (subjectData.start_date) {
      updateData.start_date = toBrasiliaDate(subjectData.start_date);
    }
    if (subjectData.end_date) {
      updateData.end_date = toBrasiliaDate(subjectData.end_date);
    }

      await updateSubject(editingSubject.id, updateData);
      
      setEditingSubject(null);
      toast({
        title: "Disciplina atualizada com sucesso!",
        description: `A disciplina ${subjectData.name} foi atualizada.`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId);
      toast({
        title: "Disciplina excluída",
        description: "A disciplina foi removida do sistema.",
        variant: "destructive",
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const openDeleteDialog = (subject: any) => {
    setDeletingSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const openEditForm = (subject: any) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleExportAttendance = (subject: any) => {
    setSelectedSubjectForExport({
      id: subject.id,
      name: subject.name,
      class_id: subject.class_id,
      class_name: getClassName(subject.class_id)
    });
    setExportDialogOpen(true);
  };

  const handleExportGrades = (subject: any) => {
    setSelectedSubjectForGradesExport({
      id: subject.id,
      name: subject.name,
      class_id: subject.class_id,
      class_name: getClassName(subject.class_id)
    });
    setGradesExportDialogOpen(true);
  };

  const handleExportSignatureSheet = async (subject: any) => {
    try {
      // Buscar alunos que tiveram ao menos uma presença na disciplina
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('subject_id', subject.id)
        .eq('class_id', subject.class_id)
        .eq('is_present', true);

      if (attendanceError) throw attendanceError;

      const studentIdsWithAttendance = [...new Set(
        (attendanceData || []).map(a => a.student_id)
      )];

      if (studentIdsWithAttendance.length === 0) {
        toast({
          title: "Sem dados",
          description: "Nenhum aluno com presença registrada nesta disciplina.",
          variant: "destructive",
        });
        return;
      }

      // Buscar apenas alunos ativos com presença
      const { data: students, error } = await supabase
        .from('profiles')
        .select('name, auto_student_id')
        .eq('class_id', subject.class_id)
        .eq('status', 'active')
        .in('id', studentIdsWithAttendance)
        .order('name');

      if (error) throw error;

      const formattedStudents = (students || []).map(s => ({
        name: s.name,
        number: s.auto_student_id?.toString() || ''
      }));

      await exportAttendanceSignatureSheet({
        subjectName: subject.name,
        className: getClassName(subject.class_id),
        students: formattedStudents
      });

      toast({
        title: "Lista de Presença exportada",
        description: "O PDF foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar a lista de presença.",
        variant: "destructive",
      });
    }
  };

  const handleExportWeeklyFrequency = async (subject: any) => {
    try {
      // Buscar alunos que tiveram ao menos uma presença na disciplina
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('subject_id', subject.id)
        .eq('class_id', subject.class_id)
        .eq('is_present', true);

      if (attendanceError) throw attendanceError;

      const studentIdsWithAttendance = [...new Set(
        (attendanceData || []).map(a => a.student_id)
      )];

      if (studentIdsWithAttendance.length === 0) {
        toast({
          title: "Sem dados",
          description: "Nenhum aluno com presença registrada nesta disciplina.",
          variant: "destructive",
        });
        return;
      }

      // Buscar apenas alunos ativos com presença
      const { data: students, error } = await supabase
        .from('profiles')
        .select('name, auto_student_id')
        .eq('class_id', subject.class_id)
        .eq('status', 'active')
        .in('id', studentIdsWithAttendance)
        .order('name');

      if (error) throw error;

      const formattedStudents = (students || []).map(s => ({
        name: s.name,
        number: s.auto_student_id?.toString() || ''
      }));

      await exportWeeklyFrequencySheet({
        subjectName: subject.name,
        className: getClassName(subject.class_id),
        students: formattedStudents
      });

      toast({
        title: "Lista de Frequência exportada",
        description: "O PDF foi gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar a lista de frequência.",
        variant: "destructive",
      });
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || subject.class_id === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'all' || subject.status === selectedStatusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  if (loading) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Disciplinas</h1>
          <Button className="flex items-center gap-2" onClick={openCreateForm}>
            <Plus size={16} />
            Nova Disciplina
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Disciplinas</p>
                  <p className="text-3xl font-bold text-primary">{subjects.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disciplinas Ativas</p>
                  <p className="text-3xl font-bold text-success">{subjects.filter(s => s.status === 'ativo').length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instrutores</p>
                  <p className="text-3xl font-bold text-warning">{classStats.totalInstructors}</p>
                </div>
                <User className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar disciplina pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Disciplinas por Curso/Turma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(getSubjectsByClass()).map(([className, classSubjects]) => (
                <div key={className} className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {className}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({classSubjects.length} disciplina{classSubjects.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classSubjects.map((subject) => (
                      <div 
                        key={subject.id} 
                        className={cn(
                          "border rounded-md p-3 bg-background transition-colors",
                          isSubjectActive(subject) 
                            ? "border-success bg-success/5" 
                            : "border-border opacity-60 grayscale"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <h4 className={cn(
                              "font-medium text-sm",
                              !isSubjectActive(subject) && "text-muted-foreground"
                            )}>{subject.name}</h4>
                            {isSubjectEndingSoon(subject) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />
                                  </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Disciplina termina em {differenceInDays(parseYMDToLocalDate((subject as any).end_date), new Date())} dia(s)</p>
                                   </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Badge 
                            variant={isSubjectActive(subject) ? "default" : "secondary"}
                          >
                            {isSubjectActive(subject) ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        {subject.code && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Código: {subject.code}
                          </p>
                        )}
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{getTeacherName(subject.teacher_id)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{subject.workload}h de carga horária</span>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            {(subject as any).start_date && (
                              <div className="flex items-center gap-1 text-success">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Início: {formatDateBR((subject as any).start_date)}
                                </span>
                              </div>
                            )}
                            
                            {(subject as any).end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-warning" />
                                <span>
                                  <span className="text-red-600 font-medium">Término:</span>{' '}
                                  <span className="text-muted-foreground">{formatDateBR((subject as any).end_date)}</span>
                                </span>
                              </div>
                            )}
                            
                            {!(subject as any).start_date && !(subject as any).end_date && (
                              <div className="text-muted-foreground">
                                Período não definido
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleExportAttendance(subject)}
                          >
                            <FileSpreadsheet className="w-3 h-3 mr-1" />
                            Exportar Frequência
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleExportGrades(subject)}
                          >
                            <FileBarChart className="w-3 h-3 mr-1" />
                            Exportar Notas
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleExportSignatureSheet(subject)}
                          >
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Lista de Presença
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleExportWeeklyFrequency(subject)}
                          >
                            <CalendarDays className="w-3 h-3 mr-1" />
                            Lista de Frequência
                          </Button>
                        </div>
                      </div>
                    ))}
                   </div>
                  
                  {classSubjects.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhuma disciplina encontrada para esta turma
                    </p>
                  )}
                </div>
              ))}
              
              {Object.keys(getSubjectsByClass()).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma disciplina cadastrada ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar disciplina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filtrar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Disciplinas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow 
                    key={subject.id}
                    className={cn(
                      !isSubjectActive(subject) && "opacity-60 text-muted-foreground"
                    )}
                  >
                     <TableCell className="font-medium">
                       <div>
                         <p className="font-medium">{subject.name}</p>
                         {subject.code && (
                           <p className="text-sm text-muted-foreground">{subject.code}</p>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>{getTeacherName(subject.teacher_id)}</TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         <Badge variant="outline" className="text-xs">
                           {getClassName(subject.class_id)}
                         </Badge>
                         {subject.class_id && (
                           <div className="text-xs text-muted-foreground">
                             <Clock className="w-3 h-3 inline mr-1" />
                             {subject.workload}h
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="space-y-1">
                            {(subject as any).start_date && (
                            <div className="text-xs flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDateBR((subject as any).start_date)}
                            </div>
                          )}
                           {(subject as any).end_date && (
                             <div className="text-xs">
                               <span className="text-red-600 font-medium">até</span>{' '}
                               <span className="text-muted-foreground">{formatDateBR((subject as any).end_date)}</span>
                             </div>
                           )}
                         {!(subject as any).start_date && !(subject as any).end_date && (
                           <span className="text-xs text-muted-foreground">Não definido</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Badge variant={subject.status === 'ativo' ? 'default' : 'secondary'}>
                           {subject.status === 'ativo' ? 'Ativo' : 'Inativo'}
                         </Badge>
                         {isSubjectEndingSoon(subject) && (
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger>
                                 <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />
                               </TooltipTrigger>
                                <TooltipContent>
                                  <p>Termina em {differenceInDays(parseYMDToLocalDate((subject as any).end_date), new Date())} dia(s)</p>
                                </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         )}
                       </div>
                     </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportAttendance(subject)}
                            title="Exportar Frequência"
                          >
                            <FileSpreadsheet size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportGrades(subject)}
                            title="Exportar Notas"
                          >
                            <FileBarChart size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditForm(subject)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteDialog(subject)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <SubjectForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingSubject ? handleEditSubject : handleCreateSubject}
          initialData={editingSubject}
          mode={editingSubject ? 'edit' : 'create'}
        />
        
        <DeleteConfirmation
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => handleDeleteSubject(deletingSubject?.id)}
          title="Excluir Disciplina"
          description="Esta ação não pode ser desfeita. A disciplina será permanentemente removida do sistema."
          itemName={deletingSubject?.name}
        />

        <SubjectAttendanceExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          subjectId={selectedSubjectForExport?.id || null}
          classId={selectedSubjectForExport?.class_id || null}
          subjectName={selectedSubjectForExport?.name || ''}
          className={selectedSubjectForExport?.class_name || ''}
        />

        <SubjectGradesExportDialog
          open={gradesExportDialogOpen}
          onOpenChange={setGradesExportDialogOpen}
          subjectId={selectedSubjectForGradesExport?.id || null}
          classId={selectedSubjectForGradesExport?.class_id || null}
          subjectName={selectedSubjectForGradesExport?.name || ''}
          className={selectedSubjectForGradesExport?.class_name || ''}
        />
      </div>
    </Layout>
  );
};

export default Subjects;