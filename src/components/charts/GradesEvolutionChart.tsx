import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface GradesEvolutionChartProps {
  data: Array<{ month: string; media: number }>;
}

export const GradesEvolutionChart = ({ data }: GradesEvolutionChartProps) => {
  if (!data.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sem dados de notas para exibir</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    media: {
      label: 'Média',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução da Média de Notas
        </CardTitle>
        <CardDescription>
          Média mensal das notas ao longo do período letivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 10]} 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Line
              type="monotone"
              dataKey="media"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
