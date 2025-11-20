import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import { useClassComparison, ClassMetrics } from "@/hooks/useClassComparison";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

const getStatusColor = (status: ClassMetrics['status']) => {
  switch (status) {
    case 'excellent':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'good':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'critical':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
  }
};

const getStatusLabel = (status: ClassMetrics['status']) => {
  switch (status) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bom';
    case 'warning':
      return 'Atenção';
    case 'critical':
      return 'Crítico';
  }
};

export const ClassComparisonCards = () => {
  const { data: classMetrics, isLoading } = useClassComparison();
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'grade' | 'absences'>('attendance');

  const sortedClasses = useMemo(() => {
    if (!classMetrics) return [];
    
    const filtered = classMetrics.filter(c => c.totalStudents > 0);
    
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'attendance':
          return b.attendanceRate - a.attendanceRate;
        case 'grade':
          return (b.avgGrade || 0) - (a.avgGrade || 0);
        case 'absences':
          return a.recentAbsences - b.recentAbsences;
        default:
          return 0;
      }
    });
  }, [classMetrics, sortBy]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!sortedClasses || sortedClasses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma turma com alunos cadastrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attendance">Frequência</SelectItem>
            <SelectItem value="grade">Média de Notas</SelectItem>
            <SelectItem value="absences">Faltas Recentes</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedClasses.map((classMetric) => (
          <Card 
            key={classMetric.id} 
            className={`shadow-sm hover:shadow-md transition-shadow ${getStatusColor(classMetric.status)}`}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg truncate" title={classMetric.name}>
                  {classMetric.name}
                </h3>
                <Badge variant="outline" className="ml-2">
                  {getStatusLabel(classMetric.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Alunos:</span>
                  <span className="font-semibold ml-auto">{classMetric.totalStudents}</span>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Frequência:</span>
                  <span className="font-semibold ml-auto">{classMetric.attendanceRate}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Média:</span>
                  <span className="font-semibold ml-auto">
                    {classMetric.avgGrade !== null ? classMetric.avgGrade.toFixed(1) : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Faltas (7d):</span>
                  <span className="font-semibold ml-auto">{classMetric.recentAbsences}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
