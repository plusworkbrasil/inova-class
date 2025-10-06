import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, UserX, Calendar, AlertTriangle } from 'lucide-react';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { AttendanceViewDialog } from '@/components/ui/attendance-view-dialog';
import { AttendanceEditForm } from '@/components/forms/AttendanceEditForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';
import { useSupabaseAttendance, type Attendance } from '@/hooks/useSupabaseAttendance';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { useAuth } from '@/hooks/useAuth';
import { toBrasiliaDate } from '@/lib/utils';


const Attendance = () => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { data: attendanceData, loading: attendanceLoading, createAttendance, updateAttendance, refetch } = useSupabaseAttendance();
  const { data: classes } = useSupabaseClasses();

  useEffect(() => {
    if (profile) {
      setUserRole(profile.role as UserRole);
      setUserName(profile.name);
    }
  }, [profile]);

  const handleAttendanceSubmit = async (data: any) => {
    try {
      // Converter a data para o timezone de Brasília antes de salvar
      const brasiliaDate = toBrasiliaDate(data.date);
      
      // Criar registros de frequência no banco de dados
      for (const student of data.attendance) {
        await createAttendance({
          student_id: student.studentId,
          class_id: data.classId,
          subject_id: data.subjectId,
          date: brasiliaDate,
          is_present: student.isPresent,
          justification: student.isPresent ? null : 'Falta não justificada'
        });
      }
      
      toast({
        title: "Chamada registrada com sucesso!",
        description: `Frequência registrada para ${data.attendance.length} alunos.`,
      });
      
      // Atualizar dados
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar chamada",
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a frequência.",
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
      const today = new Date().toISOString().split('T')[0];
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
    
    if (selectedClass) {
      filtered = filtered.filter(record => record.class_id === selectedClass);
    }
    
    return filtered;
  };

  const filteredRecords = getFilteredData();

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
              onClick={() => setIsAttendanceFormOpen(true)}
            >
              <Plus size={16} />
              Registrar Chamada
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
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Button variant="outline">Filtrar</Button>
              </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole !== 'student' && <TableHead>Aluno</TableHead>}
                  <TableHead>Turma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                  {userRole !== 'student' && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLoading ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'student' ? 5 : 6} className="text-center">
                      Carregando registros de frequência...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'student' ? 5 : 6} className="text-center">
                      Nenhum registro de frequência encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                     {userRole !== 'student' && <TableCell className="font-medium">{record.student_name || 'Aluno não encontrado'}</TableCell>}
                      <TableCell>{record.class_name || 'Turma não encontrada'}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{record.subject_name || 'Disciplina não encontrada'}</TableCell>
                      <TableCell>{getStatusBadge(record.is_present ? 'presente' : 'falta')}</TableCell>
                      <TableCell>
                        {record.justification ? (
                          <Badge variant="outline" title={record.justification}>
                            Com justificativa
                          </Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </TableCell>
                      {userRole !== 'student' && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Visualizar chamada"
                              onClick={() => handleViewAttendance(record)}
                            >
                              <Search size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Editar"
                              onClick={() => handleEditAttendance(record)}
                            >
                              <Edit size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;