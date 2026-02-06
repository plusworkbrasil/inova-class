import { useMemo, useState } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileDown, Image as ImageIcon } from 'lucide-react';
import { useAllSubjectsTimeline, TimelineSubject } from '@/hooks/useAllSubjectsTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
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
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  // Helper function to calculate subject status
  const getSubjectStatus = (startDate: string, endDate: string): 'ongoing' | 'finished' | 'future' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (end < today) return 'finished';
    if (start > today) return 'future';
    return 'ongoing';
  };

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

  // Extract available classes from subjects
  const availableClasses = useMemo(() => {
    if (subjects.length === 0) return [];
    const classes = new Map<string, string>();
    subjects.forEach(s => {
      if (s.class_id) {
        classes.set(s.class_id, s.class_name);
      }
    });
    return Array.from(classes.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  // Extract available teachers from subjects
  const availableTeachers = useMemo(() => {
    if (subjects.length === 0) return [];
    const teachers = new Map<string, string>();
    subjects.forEach(s => {
      if (s.teacher_id && s.teacher_name) {
        teachers.set(s.teacher_id, s.teacher_name);
      }
    });
    return Array.from(teachers.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  // Filter subjects by selected year first
  const filteredByYear = useMemo(() => {
    if (selectedYear === 'all') return subjects;
    const year = parseInt(selectedYear);
    return subjects.filter(s => {
      const startYear = getYear(parseISO(s.start_date));
      const endYear = getYear(parseISO(s.end_date));
      return startYear === year || endYear === year;
    });
  }, [subjects, selectedYear]);

  // Then filter by selected class
  const filteredByClass = useMemo(() => {
    if (selectedClass === 'all') return filteredByYear;
    return filteredByYear.filter(s => s.class_id === selectedClass);
  }, [filteredByYear, selectedClass]);

  // Filter by selected teacher
  const filteredByTeacher = useMemo(() => {
    if (selectedTeacher === 'all') return filteredByClass;
    return filteredByClass.filter(s => s.teacher_id === selectedTeacher);
  }, [filteredByClass, selectedTeacher]);

  // Finally filter by selected status
  const filteredSubjects = useMemo(() => {
    if (selectedStatus === 'all') return filteredByTeacher;
    return filteredByTeacher.filter(s => getSubjectStatus(s.start_date, s.end_date) === selectedStatus);
  }, [filteredByTeacher, selectedStatus]);

  // Group subjects by class
  const groupedSubjects = useMemo(() => {
    const groups = new Map<string, { 
      classId: string; 
      className: string; 
      subjects: TimelineSubject[] 
    }>();
    
    filteredSubjects.forEach(subject => {
      const key = subject.class_id;
      if (!groups.has(key)) {
        groups.set(key, {
          classId: subject.class_id,
          className: subject.class_name,
          subjects: []
        });
      }
      groups.get(key)!.subjects.push(subject);
    });
    
    // Sort groups by class name, and subjects within each group by start_date
    return Array.from(groups.values())
      .sort((a, b) => a.className.localeCompare(b.className))
      .map(group => ({
        ...group,
        subjects: group.subjects.sort((a, b) => 
          parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
        )
      }));
  }, [filteredSubjects]);

  // Export handlers
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('gantt-chart-container');
      if (!element) throw new Error('Elemento não encontrado');

      const options = {
        margin: 10,
        filename: `Cronograma_Disciplinas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(options).from(element).save();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('gantt-chart-container');
      if (!element) throw new Error('Elemento não encontrado');

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Cronograma_Disciplinas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagem exportada com sucesso!');
    } catch (error) {
      console.error('Export Image error:', error);
      toast.error('Erro ao exportar imagem');
    } finally {
      setExporting(false);
    }
  };

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

  // Calculate today's position on the timeline
  const todayPosition = useMemo(() => {
    if (filteredSubjects.length === 0) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today is within the visible timeline range
    const timelineEnd = new Date(timelineStart.getTime());
    timelineEnd.setDate(timelineEnd.getDate() + totalDays - 1);
    
    if (today < timelineStart || today > timelineEnd) {
      return null; // Today is outside visible range
    }
    
    const daysFromStart = differenceInDays(today, timelineStart);
    return (daysFromStart / totalDays) * 100;
  }, [timelineStart, totalDays, filteredSubjects.length]);

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

  if (filteredSubjects.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Ano:</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Turma:</span>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {availableClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Professor:</span>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma disciplina encontrada{selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all' || selectedStatus !== 'all' ? ' para os filtros selecionados' : ' com datas definidas'}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Ano:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Turma:</span>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {availableClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Professor:</span>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableTeachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ongoing">Em andamento</SelectItem>
                <SelectItem value="finished">Finalizadas</SelectItem>
                <SelectItem value="future">Futuras</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all' || selectedStatus !== 'all') && (
            <Badge variant="secondary">
              {filteredSubjects.length} disciplina(s)
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting || filteredSubjects.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportImage}
            disabled={exporting || filteredSubjects.length === 0}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Imagem
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div id="gantt-chart-container" className="overflow-x-auto bg-background rounded-lg p-2">
        <div className="min-w-[800px]">
          {/* Header with months */}
          <div className="flex border-b border-border">
            <div className="w-64 flex-shrink-0 p-2 font-semibold text-sm bg-muted">
              Disciplina / Turma / Professor
            </div>
            <div className="flex-1 flex relative">
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
              {/* Today marker in header */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${todayPosition}%` }}
                >
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
                    Hoje
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rows grouped by class */}
          {groupedSubjects.map((group) => {
            const color = classColorMap.get(group.classId) || CLASS_COLORS[0];
            
            return (
              <div key={group.classId}>
                {/* Class header row */}
                <div 
                  className="flex border-b-2 border-t-2"
                  style={{ borderColor: color }}
                >
                  <div 
                    className="w-64 flex-shrink-0 p-2 font-semibold text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="break-words flex-1">{group.className}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] flex-shrink-0">
                      {group.subjects.length}
                    </Badge>
                  </div>
                  <div 
                    className="flex-1 relative"
                    style={{ backgroundColor: `${color}08` }}
                  >
                    {/* Today marker in header */}
                    {todayPosition !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${todayPosition}%` }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Subject rows within group */}
                {group.subjects.map((subject, index) => {
                  const { leftPercent, widthPercent } = calculatePosition(subject.start_date, subject.end_date);
                  
                  return (
                    <div
                      key={subject.id}
                      className={`flex border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
                    >
                      <div 
                        className="w-64 flex-shrink-0 p-2 pl-4 text-xs overflow-hidden" 
                        title={`${subject.name}${subject.teacher_name ? ` - ${subject.teacher_name}` : ''}`}
                      >
                        <div className="font-medium break-words">{subject.name}</div>
                        {subject.teacher_name && (
                          <div className="text-muted-foreground/70 break-words text-[10px]">{subject.teacher_name}</div>
                        )}
                      </div>
                      <div className="flex-1 relative min-h-10 flex items-center">
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
                        
                        {/* Today marker line */}
                        {todayPosition !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                            style={{ left: `${todayPosition}%` }}
                          />
                        )}
                        
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
