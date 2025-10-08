import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SubjectTimelineCard } from '@/components/ui/subject-timeline-card';
import { useClassSubjects } from '@/hooks/useClassSubjects';
import { useSupabaseClasses } from '@/hooks/useSupabaseClasses';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassTimeline() {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { data: classes, loading: classesLoading } = useSupabaseClasses();
  const { subjects, loading: subjectsLoading, error } = useClassSubjects(selectedClassId);

  const selectedClass = classes?.find(c => c.id === selectedClassId);

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
                {subjects.map((subject) => (
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
