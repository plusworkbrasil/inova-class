import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, User, Calendar, BookOpen, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Key, Shield, FileText, Settings } from 'lucide-react';
import { UserRole } from '@/types/user';
import StudentBanner from '@/components/dashboard/StudentBanner';
import StudentNotificationCenter from '@/components/dashboard/StudentNotificationCenter';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseGrades } from '@/hooks/useSupabaseGrades';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import { useSupabaseSubjects } from '@/hooks/useSupabaseSubjects';
import { useSupabaseDeclarations } from '@/hooks/useSupabaseDeclarations';
import { ChangeOwnPasswordDialog } from '@/components/ui/change-own-password-dialog';
import { StudentEquipmentCard } from '@/components/dashboard/StudentEquipmentCard';
import { StudentProfileSettingsForm } from '@/components/forms/StudentProfileSettingsForm';
import { cn } from '@/lib/utils';

const StudentDashboard = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  // Hooks do Supabase
  const { user, profile } = useSupabaseAuth();
  const { data: grades, loading: gradesLoading } = useSupabaseGrades();
  const { data: attendance, loading: attendanceLoading } = useSupabaseAttendance();
  const { data: subjects } = useSupabaseSubjects();
  const { data: declarations } = useSupabaseDeclarations();

  useEffect(() => {
    // Recuperar dados do usuário do localStorage
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }

    // Se temos perfil do usuário logado, usar esses dados
    if (profile) {
      setUserRole(profile.role as UserRole);
      setUserName(profile.name);
    }
  }, [profile]);

  const studentName = location.state?.studentName || profile?.name || 'Aluno';
  const returnTo = location.state?.returnTo || '/reports';

  // Usar ID do usuário logado se não foi passado um studentId específico
  const currentStudentId = studentId || user?.id;

  // Filtrar dados do estudante atual
  const studentGrades = useMemo(() => {
    if (!currentStudentId) return [];
    return grades.filter(grade => grade.student_id === currentStudentId);
  }, [grades, currentStudentId]);

  const studentAttendance = useMemo(() => {
    if (!currentStudentId) return [];
    return attendance.filter(att => att.student_id === currentStudentId);
  }, [attendance, currentStudentId]);

  // Declarações do aluno
  const studentDeclarations = useMemo(() => {
    if (!currentStudentId) return [];
    return declarations.filter(dec => dec.student_id === currentStudentId);
  }, [declarations, currentStudentId]);

  const pendingDeclarations = studentDeclarations.filter(d => d.status === 'pending').length;
  const approvedDeclarations = studentDeclarations.filter(d => d.status === 'approved').length;
  const rejectedDeclarations = studentDeclarations.filter(d => d.status === 'rejected').length;

  // Informações do estudante
  const studentInfo = {
    name: studentName,
    id: currentStudentId,
    class: profile?.class_id || 'Não definida',
    enrollment: profile?.enrollment_number || profile?.student_id || 'N/A',
    email: profile?.email || 'N/A',
    phone: profile?.phone || 'N/A',
    address: `${profile?.street || ''} ${profile?.number || ''} - ${profile?.city || ''}, ${profile?.state || ''}`.trim()
  };

  // Calcular dados de frequência por mês
  const attendanceData = useMemo(() => {
    const monthlyData: { [key: string]: { presente: number; falta: number } } = {};
    
    studentAttendance.forEach(att => {
      const date = new Date(att.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { presente: 0, falta: 0 };
      }
      
      if (att.is_present) {
        monthlyData[monthKey].presente++;
      } else {
        monthlyData[monthKey].falta++;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  }, [studentAttendance]);

  // Calcular notas por disciplina
  const gradeData = useMemo(() => {
    const gradesBySubject: { [key: string]: number[] } = {};
    
    studentGrades.forEach(grade => {
      const subject = subjects.find(s => s.id === grade.subject_id);
      const subjectName = subject?.name || 'Disciplina Desconhecida';
      
      if (!gradesBySubject[subjectName]) {
        gradesBySubject[subjectName] = [];
      }
      
      gradesBySubject[subjectName].push(grade.value);
    });
    
    return Object.entries(gradesBySubject).map(([subject, values]) => ({
      subject,
      grade: values.reduce((sum, val) => sum + val, 0) / values.length,
      trend: 'stable' // Para simplificar, definindo como estável
    }));
  }, [studentGrades, subjects]);

  // Faltas recentes
  const recentAbsences = useMemo(() => {
    return studentAttendance
      .filter(att => !att.is_present)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(att => {
        const subject = subjects.find(s => s.id === att.subject_id);
        return {
          date: att.date,
          subject: subject?.name || 'Disciplina Desconhecida',
          justified: !!att.justification
        };
      });
  }, [studentAttendance, subjects]);

  // Cálculos de estatísticas
  const totalAbsences = studentAttendance.filter(att => !att.is_present).length;
  const totalPresences = studentAttendance.filter(att => att.is_present).length;
  const totalDays = studentAttendance.length;
  const attendancePercentage = totalDays > 0 ? ((totalPresences) / totalDays * 100) : 0;
  const attendancePercentageFormatted = attendancePercentage.toFixed(1);
  const averageGrade = gradeData.length > 0 ? (gradeData.reduce((acc, grade) => acc + grade.grade, 0) / gradeData.length).toFixed(1) : '0.0';
  const isAttendanceAtRisk = attendancePercentage < 75;

  const getGradeTrend = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  if (gradesLoading || attendanceLoading) {
    return (
      <Layout userRole={userRole} userName={userName} userAvatar="">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados do estudante...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(returnTo)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard do Aluno</h1>
              <p className="text-muted-foreground">{studentInfo.name} - {studentInfo.class}</p>
            </div>
          </div>
          
          {/* Botão de Configurações do Perfil */}
          {userRole === 'student' && (
            <Button 
              variant="outline" 
              onClick={() => setIsProfileSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Configurações do Perfil
            </Button>
          )}
        </div>

        {/* Banner de avisos urgentes para alunos */}
        <StudentBanner studentRole="student" />

        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Informações do Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matrícula</p>
                <p className="text-lg font-semibold">{studentInfo.enrollment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turma</p>
                <p className="text-lg font-semibold">{studentInfo.class}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg font-semibold">{studentInfo.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card de Frequência Destacado */}
          <Card className={cn(
            "relative overflow-hidden",
            isAttendanceAtRisk && "border-destructive bg-destructive/5"
          )}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Minha Frequência</p>
                <p className={cn(
                  "text-5xl font-bold",
                  isAttendanceAtRisk ? "text-destructive" : "text-green-600"
                )}>
                  {attendancePercentageFormatted}%
                </p>
                <Badge 
                  variant={isAttendanceAtRisk ? "destructive" : "default"}
                  className="mt-2"
                >
                  {isAttendanceAtRisk ? '⚠️ Atenção!' : '✓ Regular'}
                </Badge>
                {isAttendanceAtRisk && (
                  <p className="text-xs text-destructive mt-2">
                    Frequência abaixo de 75% - Risco de reprovação
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {totalPresences} presenças / {totalAbsences} faltas
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold text-green-600">{averageGrade}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {studentGrades.length} notas registradas
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Faltas</p>
                  <p className="text-3xl font-bold text-amber-600">{totalAbsences}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recentAbsences.filter(a => !a.justified).length} não justificadas
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Justificativas */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Minhas Justificativas</p>
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-amber-600">{pendingDeclarations}</p>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{approvedDeclarations}</p>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-destructive">{rejectedDeclarations}</p>
                  <p className="text-xs text-muted-foreground">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Segurança da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Mantenha sua conta segura alterando sua senha regularmente
            </p>
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              <Key className="h-4 w-4" />
              Alterar Minha Senha
            </Button>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequência Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="presente" fill="hsl(var(--success))" name="Presente" />
                    <Bar dataKey="falta" fill="hsl(var(--destructive))" name="Falta" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro de frequência encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              {gradeData.length > 0 ? (
                <div className="space-y-4">
                  {gradeData.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{grade.subject}</span>
                        {getGradeTrend(grade.trend)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={grade.grade >= 7 ? "default" : "destructive"}>
                          {grade.grade.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma nota encontrada</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Absences */}
        <Card>
          <CardHeader>
            <CardTitle>Faltas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAbsences.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAbsences.map((absence, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(absence.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{absence.subject}</TableCell>
                      <TableCell>
                        <Badge variant={absence.justified ? "secondary" : "destructive"}>
                          {absence.justified ? 'Justificada' : 'Não Justificada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma falta registrada</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Equipment Card */}
        <StudentEquipmentCard />

        {/* Módulo de Avisos Completo para Alunos */}
        <StudentNotificationCenter studentRole="student" />

        <ChangeOwnPasswordDialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />

        <StudentProfileSettingsForm
          open={isProfileSettingsOpen}
          onOpenChange={setIsProfileSettingsOpen}
          profile={profile}
        />
      </div>
    </Layout>
  );
};

export default StudentDashboard;
