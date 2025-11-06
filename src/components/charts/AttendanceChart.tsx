import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

interface AttendanceChartProps {
  data: Array<{
    month: string;
    presente: number;
    ausente: number;
    percentualPresenca: number;
  }>;
}

export const AttendanceChart = ({ data }: AttendanceChartProps) => {
  if (!data.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sem dados de frequência para exibir</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    presente: {
      label: 'Presente',
      color: 'hsl(142, 76%, 36%)',
    },
    ausente: {
      label: 'Ausente',
      color: 'hsl(0, 84%, 60%)',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Frequência Mensal
        </CardTitle>
        <CardDescription>
          Comparação entre presenças e ausências por mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="presente"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="ausente"
              stackId="1"
              stroke="hsl(0, 84%, 60%)"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
