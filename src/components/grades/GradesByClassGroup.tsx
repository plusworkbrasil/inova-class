import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Edit, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  value: number;
  max_value: number;
  date: string;
  type: string;
  teacher_id: string;
  observations?: string;
  student_name?: string;
  student_enrollment?: string;
  student_number?: string;
}

interface Subject {
  id: string;
  name: string;
  class_id: string;
  student_count?: number;
}

interface Class {
  id: string;
  name: string;
  year: number;
}

interface GroupedGrade {
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  type: string;
  date: string;
  grades: Grade[];
  stats: {
    total: number;
    average: number;
    highest: number;
    lowest: number;
    passing: number;
    failing: number;
  };
}

interface GradesByClassGroupProps {
  grades: Grade[];
  subjects: Subject[];
  classes: Class[];
  onEditGroup?: (subjectId: string, type: string, date: string) => void;
}

export const GradesByClassGroup = ({ 
  grades, 
  subjects, 
  classes,
  onEditGroup 
}: GradesByClassGroupProps) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(k => k !== groupKey)
        : [...prev, groupKey]
    );
  };

  // Agrupar notas por turma → disciplina → tipo → data
  const groupedGrades: GroupedGrade[] = grades.reduce((acc, grade) => {
    const subject = subjects.find(s => s.id === grade.subject_id);
    if (!subject) return acc;

    const classData = classes.find(c => c.id === subject.class_id);
    if (!classData) return acc;

    const key = `${classData.id}-${grade.subject_id}-${grade.type}-${grade.date}`;
    const existing = acc.find(g => 
      g.class_id === classData.id && 
      g.subject_id === grade.subject_id && 
      g.type === grade.type && 
      g.date === grade.date
    );

    if (existing) {
      existing.grades.push(grade);
    } else {
      acc.push({
        class_id: classData.id,
        class_name: classData.name,
        subject_id: grade.subject_id,
        subject_name: subject.name,
        type: grade.type,
        date: grade.date,
        grades: [grade],
        stats: {
          total: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          passing: 0,
          failing: 0,
        }
      });
    }

    return acc;
  }, [] as GroupedGrade[]);

  // Calcular estatísticas para cada grupo
  groupedGrades.forEach(group => {
    const values = group.grades.map(g => Number(g.value));
    const maxValues = group.grades.map(g => Number(g.max_value));
    const percentages = group.grades.map(g => (Number(g.value) / Number(g.max_value)) * 100);

    group.stats.total = group.grades.length;
    group.stats.average = values.reduce((sum, v) => sum + v, 0) / values.length;
    group.stats.highest = Math.max(...values);
    group.stats.lowest = Math.min(...values);
    group.stats.passing = percentages.filter(p => p >= 60).length;
    group.stats.failing = percentages.filter(p => p < 60).length;
  });

  // Ordenar por data (mais recente primeiro)
  groupedGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'prova': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'trabalho': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'seminário': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'projeto': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getGradeBadgeVariant = (grade: number, maxGrade: number): "default" | "secondary" | "destructive" => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    return 'destructive';
  };

  if (groupedGrades.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Nenhuma nota lançada ainda. Use "Lançar Notas por Turma" para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedGrades.map((group, index) => {
        const groupKey = `${group.class_id}-${group.subject_id}-${group.type}-${group.date}`;
        const isExpanded = expandedGroups.includes(groupKey);
        const avgPercentage = (group.stats.average / 10) * 100;

        return (
          <Card key={groupKey}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </Button>
                      </CollapsibleTrigger>
                      <CardTitle className="text-lg">{group.class_name}</CardTitle>
                      <Badge variant="outline">{group.subject_name}</Badge>
                      <Badge className={getTypeColor(group.type)}>{group.type}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Data: {new Date(group.date).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {group.stats.total} alunos
                      </span>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Média</p>
                          <p className="text-sm font-bold">
                            {group.stats.average.toFixed(1)}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({avgPercentage.toFixed(0)}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-success/10">
                          <TrendingUp size={16} className="text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Maior Nota</p>
                          <p className="text-sm font-bold">{group.stats.highest.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <TrendingDown size={16} className="text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Menor Nota</p>
                          <p className="text-sm font-bold">{group.stats.lowest.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <Users size={16} className="text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Abaixo da Média</p>
                          <p className="text-sm font-bold">
                            {group.stats.failing}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({group.stats.total > 0 ? ((group.stats.failing / group.stats.total) * 100).toFixed(0) : 0}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {onEditGroup && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditGroup(group.subject_id, group.type, group.date)}
                      >
                        <Edit size={14} className="mr-1" />
                        Editar Turma
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome do Aluno</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Percentual</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.grades
                        .sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
                        .map((grade) => {
                          const percentage = (Number(grade.value) / Number(grade.max_value)) * 100;
                          return (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">
                                {grade.student_enrollment || grade.student_number || 'N/A'}
                              </TableCell>
                              <TableCell>{grade.student_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={getGradeBadgeVariant(Number(grade.value), Number(grade.max_value))}>
                                  {grade.value}/{grade.max_value}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={percentage >= 60 ? 'text-success' : 'text-destructive'}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {grade.observations || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};
