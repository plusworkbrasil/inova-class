import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowLeft, User, Calendar, BookOpen, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { UserRole } from '@/types/user';

const StudentDashboard = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    // Recuperar dados do usuário do localStorage
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }
  }, []);

  const studentName = location.state?.studentName || 'Aluno';
  const returnTo = location.state?.returnTo || '/reports';

  // Mock data for the student
  const studentInfo = {
    name: studentName,
    id: studentId,
    class: '1º Ano A',
    enrollment: '2024001',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP'
  };

  const attendanceData = [
    { month: 'Jan', presente: 22, falta: 3 },
    { month: 'Fev', presente: 20, falta: 4 },
    { month: 'Mar', presente: 21, falta: 2 },
    { month: 'Abr', presente: 23, falta: 1 },
    { month: 'Mai', presente: 19, falta: 5 },
    { month: 'Jun', presente: 22, falta: 2 },
  ];

  const gradeData = [
    { subject: 'Matemática', grade: 7.5, trend: 'up' },
    { subject: 'Português', grade: 8.2, trend: 'up' },
    { subject: 'História', grade: 6.8, trend: 'down' },
    { subject: 'Geografia', grade: 8.0, trend: 'stable' },
    { subject: 'Ciências', grade: 7.3, trend: 'up' },
  ];

  const recentAbsences = [
    { date: '2024-01-15', subject: 'Matemática', justified: false },
    { date: '2024-01-12', subject: 'Português', justified: true },
    { date: '2024-01-08', subject: 'História', justified: false },
  ];

  const totalAbsences = attendanceData.reduce((acc, month) => acc + month.falta, 0);
  const totalDays = attendanceData.reduce((acc, month) => acc + month.presente + month.falta, 0);
  const attendancePercentage = ((totalDays - totalAbsences) / totalDays * 100).toFixed(1);
  const averageGrade = (gradeData.reduce((acc, grade) => acc + grade.grade, 0) / gradeData.length).toFixed(1);

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

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Frequência</p>
                  <p className="text-3xl font-bold text-primary">{attendancePercentage}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold text-success">{averageGrade}</p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Faltas</p>
                  <p className="text-3xl font-bold text-warning">{totalAbsences}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Faltas Não Justificadas</p>
                  <p className="text-3xl font-bold text-destructive">
                    {recentAbsences.filter(absence => !absence.justified).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequência Mensal</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Recent Absences */}
        <Card>
          <CardHeader>
            <CardTitle>Faltas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentDashboard;