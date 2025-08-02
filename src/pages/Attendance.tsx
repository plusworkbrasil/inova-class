import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, UserX, Calendar, AlertTriangle } from 'lucide-react';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { useToast } from '@/hooks/use-toast';

const mockAttendanceData = [
  { 
    id: 1, 
    studentName: 'João Silva', 
    class: '1º Ano A',
    date: '2024-08-01',
    subject: 'Matemática',
    status: 'presente',
    absences: 2
  },
  { 
    id: 2, 
    studentName: 'Maria Santos', 
    class: '1º Ano A',
    date: '2024-08-01',
    subject: 'Matemática',
    status: 'falta',
    absences: 5
  },
  { 
    id: 3, 
    studentName: 'Pedro Oliveira', 
    class: '2º Ano B',
    date: '2024-08-01',
    subject: 'Português',
    status: 'presente',
    absences: 1
  },
  { 
    id: 4, 
    studentName: 'Ana Costa', 
    class: '2º Ano B',
    date: '2024-08-01',
    subject: 'Português',
    status: 'falta',
    absences: 4
  },
];

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendanceData);
  const { toast } = useToast();

  const handleAttendanceSubmit = (data: any) => {
    // Simular criação de registros de frequência
    const newRecords = data.attendance.map((student: any, index: number) => ({
      id: attendanceRecords.length + index + 1,
      studentName: student.studentName,
      class: mockClasses.find(c => c.id === data.classId)?.name || '',
      date: data.date,
      subject: mockSubjects.find(s => s.id === data.subjectId)?.name || '',
      status: student.isPresent ? 'presente' : 'falta',
      absences: Math.floor(Math.random() * 6), // Simulação
    }));

    setAttendanceRecords([...newRecords, ...attendanceRecords]);
    
    toast({
      title: "Chamada registrada com sucesso!",
      description: `Frequência registrada para ${data.attendance.length} alunos.`,
    });
  };

  const mockClasses = [
    { id: '1a', name: '1º Ano A' },
    { id: '1b', name: '1º Ano B' },
    { id: '2a', name: '2º Ano A' },
    { id: '2b', name: '2º Ano B' },
    { id: '3a', name: '3º Ano A' },
  ];

  const mockSubjects = [
    { id: 'mat', name: 'Matemática' },
    { id: 'por', name: 'Português' },
    { id: 'his', name: 'História' },
    { id: 'geo', name: 'Geografia' },
    { id: 'cie', name: 'Ciências' },
  ];

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

  return (
    <Layout userRole="admin" userName="Admin" userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Controle de Frequência</h1>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAttendanceFormOpen(true)}
          >
            <Plus size={16} />
            Registrar Chamada
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Presentes Hoje</p>
                  <p className="text-3xl font-bold text-success">85</p>
                </div>
                <UserX className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Faltas Hoje</p>
                  <p className="text-3xl font-bold text-destructive">15</p>
                </div>
                <UserX className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">% Frequência</p>
                  <p className="text-3xl font-bold text-primary">85%</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alunos com +3 Faltas</p>
                  <p className="text-3xl font-bold text-warning">8</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <SelectItem value="1a">1º Ano A</SelectItem>
                  <SelectItem value="1b">1º Ano B</SelectItem>
                  <SelectItem value="2a">2º Ano A</SelectItem>
                  <SelectItem value="2b">2º Ano B</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Filtrar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total de Faltas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.class}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{record.subject}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{getAbsencesBadge(record.absences)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <AttendanceForm
          open={isAttendanceFormOpen}
          onOpenChange={setIsAttendanceFormOpen}
          onSubmit={handleAttendanceSubmit}
        />
      </div>
    </Layout>
  );
};

export default Attendance;