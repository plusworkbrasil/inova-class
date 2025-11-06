import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { BookOpen } from 'lucide-react';

interface SubjectPerformanceChartProps {
  data: Array<{
    name: string;
    media: number;
    frequencia: number;
  }>;
}

export const SubjectPerformanceChart = ({ data }: SubjectPerformanceChartProps) => {
  if (!data.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sem dados de disciplinas para exibir</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    media: {
      label: 'Média',
      color: 'hsl(var(--chart-2))',
    },
    frequencia: {
      label: 'Frequência',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Desempenho por Disciplina
        </CardTitle>
        <CardDescription>
          Comparação de média de notas e registros de frequência
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }}
              height={60}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="media" 
              fill="hsl(var(--chart-2))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="frequencia" 
              fill="hsl(var(--chart-3))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
