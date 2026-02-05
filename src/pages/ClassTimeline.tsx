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
import { ArrowLeft, Calendar, AlertTriangle, ChevronDown, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUrgentSubjects } from '@/hooks/useUrgentSubjects';
import { SubjectsGanttChart } from '@/components/charts/SubjectsGanttChart';
export default function ClassTimeline() {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Hook para disciplinas urgentes (principal)
  const { subjects: urgentSubjects, loading: urgentLoading, error: urgentError } = useUrgentSubjects();
  
  // Hook para turmas (para filtro opcional)
  const { data: classes, loading: classesLoading } = useSupabaseClasses();
  
  // Hook para disciplinas de turma específica (opcional)
  const { subjects: classSubjects, loading: classSubjectsLoading, error: classError } = useClassSubjects(selectedClassId);

  // Separar disciplinas críticas (≤ 2 dias) das urgentes (3-4 dias)
  const criticalSubjects = urgentSubjects.filter(s => s.days_remaining <= 2);
  const warningSubjects = urgentSubjects.filter(s => s.days_remaining > 2 && s.days_remaining <= 4);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Disciplinas Urgentes
                {urgentSubjects.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {urgentSubjects.length} urgente{urgentSubjects.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Disciplinas que terminam em até 4 dias
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {urgentLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {urgentError && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{urgentError}</p>
            </CardContent>
          </Card>
        )}

        {/* Critical Subjects (≤ 2 dias) */}
        {!urgentLoading && !urgentError && criticalSubjects.length > 0 && (
          <Card className="mb-6 border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                🔴 CRÍTICAS - Terminam em até 2 dias
                <Badge variant="destructive">{criticalSubjects.length}</Badge>
              </CardTitle>
              <CardDescription>
                ATENÇÃO: Estas disciplinas estão próximas de finalizar!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalSubjects.map((subject) => (
                <div key={subject.id} className="space-y-1">
                  <SubjectTimelineCard
                    name={subject.name}
                    teacherName={subject.teacher_name || 'Não atribuído'}
                    startDate={subject.start_date}
                    endDate={subject.end_date}
                    code={subject.code}
                    description={subject.description}
                  />
                  <p className="text-sm text-muted-foreground ml-2">
                    📚 Turma: {subject.class_name} {subject.class_year && `(${subject.class_year})`}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Warning Subjects (3-4 dias) */}
        {!urgentLoading && !urgentError && warningSubjects.length > 0 && (
          <Card className="mb-6 border-2 border-orange-400 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ URGENTES - Terminam em 3-4 dias
                <Badge className="bg-orange-500">{warningSubjects.length}</Badge>
              </CardTitle>
              <CardDescription>
                Estas disciplinas também precisam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {warningSubjects.map((subject) => (
                <div key={subject.id} className="space-y-1">
                  <SubjectTimelineCard
                    name={subject.name}
                    teacherName={subject.teacher_name || 'Não atribuído'}
                    startDate={subject.start_date}
                    endDate={subject.end_date}
                    code={subject.code}
                    description={subject.description}
                  />
                  <p className="text-sm text-muted-foreground ml-2">
                    📚 Turma: {subject.class_name} {subject.class_year && `(${subject.class_year})`}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!urgentLoading && !urgentError && urgentSubjects.length === 0 && (
          <Card className="border-green-400 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ✅ Sem disciplinas urgentes!
                </p>
                <p className="text-muted-foreground">
                  Nenhuma disciplina está próxima de finalizar nos próximos 4 dias.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtro opcional por turma */}
        <Collapsible className="mt-8">
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🔍 Filtrar por turma específica</span>
                  <ChevronDown className="h-5 w-5" />
                </CardTitle>
                <CardDescription>
                  Clique para ver todas as disciplinas de uma turma
                </CardDescription>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-6">
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

                {/* Disciplinas da turma selecionada */}
                {selectedClassId && (
                  <div className="mt-4 space-y-3">
                    {classSubjectsLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : classError ? (
                      <p className="text-destructive text-center">{classError}</p>
                    ) : classSubjects.length > 0 ? (
                      classSubjects.map(subject => (
                        <SubjectTimelineCard
                          key={subject.id}
                          name={subject.name}
                          teacherName={subject.teacher_name || 'Não atribuído'}
                          startDate={subject.start_date}
                          endDate={subject.end_date}
                          code={subject.code}
                          description={subject.description}
                        />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center">
                        Nenhuma disciplina nesta turma
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Layout>
  );
}
