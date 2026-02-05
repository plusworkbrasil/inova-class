import { useMemo, useState } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllSubjectsTimeline, TimelineSubject } from '@/hooks/useAllSubjectsTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CLASS_COLORS = [
  'hsl(0, 84%, 60%)',    // vermelho
  'hsl(25, 95%, 53%)',   // laranja
  'hsl(84, 81%, 44%)',   // verde limão
  'hsl(142, 71%, 45%)',  // verde
  'hsl(187, 92%, 42%)',  // ciano
  'hsl(217, 91%, 60%)',  // azul
  'hsl(263, 90%, 51%)',  // violeta
  'hsl(330, 81%, 60%)',  // rosa
  'hsl(239, 84%, 67%)',  // índigo
];

interface GanttBarProps {
  subject: TimelineSubject;
  color: string;
  leftPercent: number;
  widthPercent: number;
}

function GanttBar({ subject, color, leftPercent, widthPercent }: GanttBarProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute h-6 rounded-sm cursor-pointer transition-all hover:opacity-80 hover:scale-y-110"
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(widthPercent, 1)}%`,
              backgroundColor: color,
            }}
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{subject.name}</p>
            <p className="text-sm text-muted-foreground">Turma: {subject.class_name}</p>
            {subject.teacher_name && (
              <p className="text-sm text-muted-foreground">Professor: {subject.teacher_name}</p>
            )}
            <p className="text-xs">
              {format(parseISO(subject.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(parseISO(subject.end_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SubjectsGanttChart() {
  const { subjects, loading, error } = useAllSubjectsTimeline();
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Extract available years from subjects
  const availableYears = useMemo(() => {
    if (subjects.length === 0) return [];
    const years = new Set<number>();
    subjects.forEach(s => {
      years.add(getYear(parseISO(s.start_date)));
      years.add(getYear(parseISO(s.end_date)));
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }, [subjects]);

  // Filter subjects by selected year
  const filteredSubjects = useMemo(() => {
    if (selectedYear === 'all') return subjects;
    const year = parseInt(selectedYear);
    return subjects.filter(s => {
      const startYear = getYear(parseISO(s.start_date));
      const endYear = getYear(parseISO(s.end_date));
      return startYear === year || endYear === year;
    });
  }, [subjects, selectedYear]);

  const { months, timelineStart, totalDays, classColorMap, uniqueClasses } = useMemo(() => {
    if (filteredSubjects.length === 0) {
      return { months: [], timelineStart: new Date(), totalDays: 1, classColorMap: new Map(), uniqueClasses: [] };
    }

    // Find min and max dates
    const dates = filteredSubjects.flatMap(s => [parseISO(s.start_date), parseISO(s.end_date)]);
    const minDate = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfMonth(new Date(Math.max(...dates.map(d => d.getTime()))));

    // Generate months array
    const monthsArray = eachMonthOfInterval({ start: minDate, end: maxDate });

    // Calculate total days
    const total = differenceInDays(maxDate, minDate) + 1;

    // Create color map for classes
    const classes = [...new Set(filteredSubjects.map(s => s.class_id))];
    const colorMap = new Map<string, string>();
    classes.forEach((classId, index) => {
      colorMap.set(classId, CLASS_COLORS[index % CLASS_COLORS.length]);
    });

    // Get unique classes with names for legend
    const uniqueClassList = [...new Set(filteredSubjects.map(s => JSON.stringify({ id: s.class_id, name: s.class_name })))]
      .map(s => JSON.parse(s));

    return {
      months: monthsArray,
      timelineStart: minDate,
      totalDays: total,
      classColorMap: colorMap,
      uniqueClasses: uniqueClassList,
    };
  }, [filteredSubjects]);

  const calculatePosition = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const daysFromStart = differenceInDays(start, timelineStart);
    const duration = differenceInDays(end, start) + 1;
    
    const leftPercent = (daysFromStart / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return { leftPercent, widthPercent };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma disciplina com datas definidas encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with months */}
          <div className="flex border-b border-border">
            <div className="w-48 flex-shrink-0 p-2 font-semibold text-sm bg-muted">
              Disciplina - Turma
            </div>
            <div className="flex-1 flex">
              {months.map((month, index) => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                const widthPercent = (daysInMonth / totalDays) * 100;
                
                return (
                  <div
                    key={index}
                    className="text-center p-2 text-xs font-medium border-l border-border bg-muted"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {format(month, 'MMM yyyy', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {subjects.map((subject, index) => {
            const { leftPercent, widthPercent } = calculatePosition(subject.start_date, subject.end_date);
            const color = classColorMap.get(subject.class_id) || CLASS_COLORS[0];
            
            return (
              <div
                key={subject.id}
                className={`flex border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
              >
                <div className="w-48 flex-shrink-0 p-2 text-xs truncate" title={`${subject.name} - ${subject.class_name}`}>
                  <div className="font-medium truncate">{subject.name}</div>
                  <div className="text-muted-foreground truncate">{subject.class_name}</div>
                </div>
                <div className="flex-1 relative h-12 flex items-center">
                  {/* Month grid lines */}
                  {months.map((month, monthIndex) => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                    const widthPercent = (daysInMonth / totalDays) * 100;
                    const leftPercent = (differenceInDays(monthStart, timelineStart) / totalDays) * 100;
                    
                    return (
                      <div
                        key={monthIndex}
                        className="absolute h-full border-l border-border/50"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      />
                    );
                  })}
                  
                  {/* Gantt bar */}
                  <GanttBar
                    subject={subject}
                    color={color}
                    leftPercent={leftPercent}
                    widthPercent={widthPercent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
        <span className="text-sm font-medium text-muted-foreground">Legenda:</span>
        {uniqueClasses.map((classItem, index) => (
          <Badge
            key={classItem.id}
            variant="outline"
            className="gap-1"
            style={{ borderColor: classColorMap.get(classItem.id) }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: classColorMap.get(classItem.id) }}
            />
            {classItem.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
