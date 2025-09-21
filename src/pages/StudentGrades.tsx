import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import { BookOpen, Award, TrendingUp, Calendar } from 'lucide-react';

interface Grade {
  id: string;
  value: number;
  max_value: number;
  date: string;
  type: string;
  observations?: string;
  subject: {
    name: string;
    code?: string;
  };
}

interface SubjectGrades {
  subject_name: string;
  subject_code?: string;
  grades: Grade[];
  average: number;
  total_points: number;
  max_total_points: number;
}

const StudentGrades = () => {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentGrades();
  }, [profile?.id]);

  const fetchStudentGrades = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar notas do estudante
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          value,
          max_value,
          date,
          type,
          observations,
          subject_id,
          subjects!inner(name, code)
        `)
        .eq('student_id', profile.id)
        .order('date', { ascending: false });

      if (gradesError) throw gradesError;

      // Agrupar notas por disciplina
      const groupedGrades: { [key: string]: SubjectGrades } = {};

      gradesData.forEach((grade: any) => {
        const subjectName = grade.subjects.name;
        const subjectCode = grade.subjects.code;

        if (!groupedGrades[subjectName]) {
          groupedGrades[subjectName] = {
            subject_name: subjectName,
            subject_code: subjectCode,
            grades: [],
            average: 0,
            total_points: 0,
            max_total_points: 0,
          };
        }

        groupedGrades[subjectName].grades.push({
          id: grade.id,
          value: grade.value,
          max_value: grade.max_value,
          date: grade.date,
          type: grade.type,
          observations: grade.observations,
          subject: {
            name: subjectName,
            code: subjectCode,
          },
        });
      });

      // Calcular médias
      Object.keys(groupedGrades).forEach((subjectName) => {
        const subject = groupedGrades[subjectName];
        const totalPoints = subject.grades.reduce((sum, grade) => sum + grade.value, 0);
        const maxTotalPoints = subject.grades.reduce((sum, grade) => sum + grade.max_value, 0);
        
        subject.total_points = totalPoints;
        subject.max_total_points = maxTotalPoints;
        subject.average = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints) * 10 : 0;
      });

      setGrades(Object.values(groupedGrades));
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      setError('Erro ao carregar suas notas. Tente novamente.');
      toast.error('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 7) return 'text-green-600';
    if (percentage >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeVariant = (percentage: number) => {
    if (percentage >= 7) return 'default';
    if (percentage >= 5) return 'secondary';
    return 'destructive';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!profile || profile.role !== 'student') {
    return (
      <Layout>
        <Alert>
          <AlertDescription>
            Acesso negado. Esta página é apenas para estudantes.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Minhas Notas</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Nenhuma nota encontrada</p>
              <p className="text-sm text-muted-foreground">
                Suas notas aparecerão aqui quando forem lançadas pelos professores.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resumo geral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo Acadêmico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {grades.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Disciplinas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {grades.reduce((sum, subject) => sum + subject.grades.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total de Notas</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getGradeColor(
                      grades.reduce((sum, subject) => sum + subject.average, 0) / grades.length
                    )}`}>
                      {grades.length > 0 
                        ? (grades.reduce((sum, subject) => sum + subject.average, 0) / grades.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Média Geral</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas por disciplina */}
            {grades.map((subject) => (
              <Card key={subject.subject_name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {subject.subject_name}
                      </CardTitle>
                      {subject.subject_code && (
                        <CardDescription>Código: {subject.subject_code}</CardDescription>
                      )}
                    </div>
                    <Badge variant={getGradeBadgeVariant(subject.average)}>
                      Média: {subject.average.toFixed(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.grades.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma nota lançada ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subject.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{grade.type}</span>
                              <Badge variant="outline" className="text-xs">
                                {grade.value.toFixed(1)}/{grade.max_value.toFixed(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(grade.date)}
                            </div>
                            {grade.observations && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {grade.observations}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getGradeColor(
                              (grade.value / grade.max_value) * 10
                            )}`}>
                              {((grade.value / grade.max_value) * 10).toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {((grade.value / grade.max_value) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentGrades;