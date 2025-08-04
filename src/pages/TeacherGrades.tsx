import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, BookOpen, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { GradeForm } from '@/components/forms/GradeForm';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/user';

// Mock do instrutor atual
const currentInstructor = {
  id: 'teacher001',
  name: 'Inst. Carlos Silva',
  subjects: ['Matemática', 'Física'],
  classes: ['1º Ano A', '2º Ano B', '3º Ano A']
};

// Mock de dados das turmas e alunos do instrutor
const mockClassStudents = {
  '1º Ano A': [
    { id: '2024001', name: 'João Silva' },
    { id: '2024002', name: 'Maria Santos' },
    { id: '2024003', name: 'Pedro Oliveira' },
    { id: '2024004', name: 'Ana Costa' },
  ],
  '2º Ano B': [
    { id: '2024005', name: 'Carlos Souza' },
    { id: '2024006', name: 'Lucia Ferreira' },
    { id: '2024007', name: 'Rafael Lima' },
  ],
  '3º Ano A': [
    { id: '2024008', name: 'Fernanda Silva' },
    { id: '2024009', name: 'Gabriel Santos' },
    { id: '2024010', name: 'Isabella Costa' },
  ]
};

const mockGradesData = [
  {
    id: 1,
    studentName: 'João Silva',
    studentId: '2024001',
    class: '1º Ano A',
    subject: 'Matemática',
    grade: 8.5,
    maxGrade: 10,
    type: 'Prova',
    date: '2024-01-15',
    teacher: 'Inst. Carlos Silva'
  },
  {
    id: 2,
    studentName: 'Maria Santos',
    studentId: '2024002',
    class: '1º Ano A',
    subject: 'Matemática',
    grade: 7.2,
    maxGrade: 10,
    type: 'Trabalho',
    date: '2024-01-14',
    teacher: 'Inst. Carlos Silva'
  },
];

const TeacherGrades = () => {
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [userName, setUserName] = useState('Instrutor');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [grades, setGrades] = useState(mockGradesData);
  const [batchGradeMode, setBatchGradeMode] = useState(false);
  const [selectedClassForBatch, setSelectedClassForBatch] = useState('');
  const [selectedSubjectForBatch, setSelectedSubjectForBatch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Recuperar dados do usuário do localStorage
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedName = localStorage.getItem('userName');
    
    console.log('TeacherGrades - savedRole:', savedRole, 'savedName:', savedName);
    
    if (savedRole && savedName) {
      setUserRole(savedRole);
      setUserName(savedName);
    }
  }, []);

  console.log('TeacherGrades component is rendering, userRole:', userRole);

  const handleCreateGrade = (data: any) => {
    const newGrade = {
      id: grades.length + 1,
      studentName: data.studentName,
      studentId: data.studentId,
      class: data.class,
      subject: data.subject,
      grade: data.grade,
      maxGrade: data.maxGrade,
      type: data.type,
      date: data.date,
      teacher: currentInstructor.name,
    };
    setGrades([newGrade, ...grades]);
    toast({
      title: "Nota lançada com sucesso!",
      description: `Nota ${data.grade} registrada para ${data.studentName}.`,
    });
  };

  const handleEditGrade = (gradeData: any) => {
    const updatedGrades = grades.map(g => 
      g.id === editingGrade.id 
        ? { ...g, ...gradeData }
        : g
    );
    setGrades(updatedGrades);
    setEditingGrade(null);
    toast({
      title: "Nota atualizada com sucesso!",
      description: `Nota de ${gradeData.studentName} foi atualizada.`,
    });
  };

  const openEditForm = (grade: any) => {
    setEditingGrade(grade);
    setIsGradeFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingGrade(null);
    setBatchGradeMode(false);
    setIsGradeFormOpen(true);
  };

  const openBatchGradeForm = () => {
    setBatchGradeMode(true);
    setIsGradeFormOpen(true);
  };

  const getGradeBadgeVariant = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prova': return 'bg-blue-100 text-blue-800';
      case 'trabalho': return 'bg-green-100 text-green-800';
      case 'seminário': return 'bg-purple-100 text-purple-800';
      case 'projeto': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar notas apenas das disciplinas do instrutor
  const teacherGrades = grades.filter(grade => 
    currentInstructor.subjects.includes(grade.subject) &&
    currentInstructor.classes.includes(grade.class)
  );

  // Calcular estatísticas
  const totalGrades = teacherGrades.length;
  const averageGrade = teacherGrades.length > 0 ? 
    teacherGrades.reduce((sum, grade) => sum + grade.grade, 0) / totalGrades : 0;
  const failingGrades = teacherGrades.filter(grade => (grade.grade / grade.maxGrade) * 100 < 60).length;
  const subjectsCount = currentInstructor.subjects.length;

  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Minhas Notas</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openBatchGradeForm}>
              <Users size={16} className="mr-2" />
              Lançar Turma
            </Button>
            <Button onClick={openCreateForm}>
              <Plus size={16} className="mr-2" />
              Lançar Nota Individual
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Notas</p>
                  <p className="text-3xl font-bold text-primary">{totalGrades}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <p className="text-3xl font-bold text-success">{averageGrade.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minhas Disciplinas</p>
                  <p className="text-3xl font-bold text-info">{subjectsCount}</p>
                </div>
                <BookOpen className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notas Baixas</p>
                  <p className="text-3xl font-bold text-warning">{failingGrades}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lançamento Rápido de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentInstructor.subjects.map(subject => (
                <div key={subject} className="space-y-3">
                  <h4 className="font-semibold text-lg text-primary">{subject}</h4>
                  <div className="space-y-2">
                    {currentInstructor.classes.map(className => (
                      <div key={`${subject}-${className}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div>
                          <p className="font-medium">{className}</p>
                          <p className="text-sm text-muted-foreground">
                            {mockClassStudents[className as keyof typeof mockClassStudents]?.length || 0} alunos
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedClassForBatch(className);
                            setSelectedSubjectForBatch(subject);
                            setBatchGradeMode(true);
                            setIsGradeFormOpen(true);
                          }}
                        >
                          Lançar Notas
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas Disciplinas e Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Disciplinas:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentInstructor.subjects.map(subject => (
                    <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Turmas:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentInstructor.classes.map(className => (
                    <Badge key={className} variant="outline">{className}</Badge>
                  ))}
                </div>
              </div>
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
                  {currentInstructor.classes.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {currentInstructor.subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.studentName}</TableCell>
                    <TableCell>{grade.studentId}</TableCell>
                    <TableCell>{grade.class}</TableCell>
                    <TableCell>{grade.subject}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(grade.type)}`}>
                        {grade.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getGradeBadgeVariant(grade.grade, grade.maxGrade)}>
                        {grade.grade}/{grade.maxGrade}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(grade.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditForm(grade)}
                      >
                        <Edit size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <GradeForm
          open={isGradeFormOpen}
          onOpenChange={setIsGradeFormOpen}
          onSubmit={editingGrade ? handleEditGrade : handleCreateGrade}
          initialData={editingGrade}
          mode={editingGrade ? 'edit' : 'create'}
          userRole="teacher"
          currentUser={currentInstructor}
        />
      </div>
    </Layout>
  );
};

export default TeacherGrades;