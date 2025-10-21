import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { parseYMDToLocalDate, formatDateBR } from '@/lib/utils';

interface SubjectTimelineCardProps {
  name: string;
  teacherName: string;
  startDate: string | null;
  endDate: string | null;
  code?: string | null;
  description?: string | null;
}

const getSubjectStatus = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return { label: 'Sem data', variant: 'outline' as const, progress: 0 };
  
  const now = new Date();
  const start = parseYMDToLocalDate(startDate);
  const end = parseYMDToLocalDate(endDate);
  
  if (now < start) return { label: 'Não iniciada', variant: 'secondary' as const, progress: 0 };
  if (now > end) return { label: 'Concluída', variant: 'outline' as const, progress: 100 };
  return { label: 'Em andamento', variant: 'default' as const, progress: calculateProgress(start, end, now) };
};

const calculateProgress = (start: Date, end: Date, now: Date): number => {
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

const calculateDays = (startDate: string | null, endDate: string | null): number => {
  if (!startDate || !endDate) return 0;
  const start = parseYMDToLocalDate(startDate);
  const end = parseYMDToLocalDate(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function SubjectTimelineCard({
  name,
  teacherName,
  startDate,
  endDate,
  code,
  description
}: SubjectTimelineCardProps) {
  const status = getSubjectStatus(startDate, endDate);
  const totalDays = calculateDays(startDate, endDate);

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definida';
    return formatDateBR(date);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            {code && <p className="text-sm text-muted-foreground">Código: {code}</p>}
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-medium">Professor:</span> {teacherName}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}
        <div className="flex items-center justify-between text-sm mb-3">
          <span>
            <span className="font-medium">Início:</span> {formatDate(startDate)}
          </span>
          <span>
            <span className="font-medium">Fim:</span> {formatDate(endDate)}
          </span>
          {totalDays > 0 && (
            <span className="text-muted-foreground">({totalDays} dias)</span>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
