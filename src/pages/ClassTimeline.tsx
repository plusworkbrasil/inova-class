import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubjectTimelineCard } from '@/components/ui/subject-timeline-card';
import { useClassSubjects } from '@/hooks/useClassSubjects';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { parseYMDToLocalDate } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

export default function ClassTimeline() {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { data: classes, loading: classesLoading } = useSupabaseClasses();
  const { subjects, loading: subjectsLoading, error } = useClassSubjects(selectedClassId);

  const selectedClass = classes?.find(c => c.id === selectedClassId);

  const urgentSubjects = subjects.filter(s => {
    if (!s.end_date) return false;
    const now = new Date();
    const end = parseYMDToLocalDate(s.end_date);
    const days = differenceInDays(end, now);
    return days <= 4 && days >= 0;
  });

  const sortedSubjects = [...subjects].sort((a, b) => {
    const getDays = (endDate: string | null) => {
      if (!endDate) return 999;
      const now = new Date();
      const end = parseYMDToLocalDate(endDate);
      const days = differenceInDays(end, now);
      return days >= 0 ? days : 999;
    };
    
    const daysA = getDays(a.end_date);
    const daysB = getDays(b.end_date);
    
    if (daysA <= 4 && daysB > 4) return -1;
    if (daysB <= 4 && daysA > 4) return 1;
    
    return daysA - daysB;
  });

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Cronograma de Disciplinas
                {selectedClassId && urgentSubjects.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {urgentSubjects.length} urgente{urgentSubjects.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize a timeline das disciplinas por turma
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecione uma Turma</CardTitle>
            <CardDescription>
              Escolha a turma para visualizar o cronograma de suas disciplinas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedClassId || ''}
              onValueChange={(value) => setSelectedClassId(value)}
              disabled={classesLoading}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Selecione uma turma..." />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedClassId && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">
                {selectedClass?.name}
              </h2>
              <p className="text-muted-foreground">
                Ano: {selectedClass?.year}
              </p>
            </div>

            {!subjectsLoading && !error && urgentSubjects.length > 0 && (
              <Card className="mb-6 border-orange-400 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    Disciplinas Finalizando em Breve
                    <Badge variant="destructive">{urgentSubjects.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Estas disciplinas estão próximas do término (≤ 4 dias)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {urgentSubjects.map((subject) => (
                    <SubjectTimelineCard
                      key={subject.id}
                      name={subject.name}
                      teacherName={subject.teacher_name || 'Não atribuído'}
                      startDate={subject.start_date}
                      endDate={subject.end_date}
                      code={subject.code}
                      description={subject.description}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {!subjectsLoading && !error && subjects.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Todas as Disciplinas</h3>
              </div>
            )}

            {subjectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-destructive text-center">{error}</p>
                </CardContent>
              </Card>
            ) : subjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Nenhuma disciplina cadastrada para esta turma.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedSubjects.map((subject) => (
                  <SubjectTimelineCard
                    key={subject.id}
                    name={subject.name}
                    teacherName={subject.teacher_name || 'Não atribuído'}
                    startDate={subject.start_date}
                    endDate={subject.end_date}
                    code={subject.code}
                    description={subject.description}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedClassId && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                Selecione uma turma para visualizar o cronograma de disciplinas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
