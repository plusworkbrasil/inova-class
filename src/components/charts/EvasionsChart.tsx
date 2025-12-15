import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evasion {
  id: string;
  date: string;
  status: string;
}

interface EvasionsChartProps {
  evasions: Evasion[];
}

export const EvasionsChart = ({ evasions }: EvasionsChartProps) => {
  const chartData = useMemo(() => {
    const months: { month: string; monthKey: string; active: number; cancelled: number }[] = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthEvasions = evasions.filter(e => {
        const evasionDate = new Date(e.date);
        return isWithinInterval(evasionDate, { start: monthStart, end: monthEnd });
      });

      const active = monthEvasions.filter(e => e.status === 'active').length;
      const cancelled = monthEvasions.filter(e => e.status === 'cancelled').length;

      months.push({
        month: format(monthDate, 'MMM', { locale: ptBR }).charAt(0).toUpperCase() + format(monthDate, 'MMM', { locale: ptBR }).slice(1),
        monthKey: format(monthDate, 'yyyy-MM'),
        active,
        cancelled
      });
    }

    return months;
  }, [evasions]);

  const totalInPeriod = useMemo(() => {
    return chartData.reduce((acc, m) => acc + m.active + m.cancelled, 0);
  }, [chartData]);

  if (totalInPeriod === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            📈 Tendência de Evasões (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhuma evasão registrada nos últimos 6 meses
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          📈 Tendência de Evasões (Últimos 6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'active' ? 'Ativas' : 'Canceladas'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend 
              formatter={(value) => value === 'active' ? 'Ativas' : 'Canceladas'}
            />
            <Bar 
              dataKey="active" 
              stackId="evasions"
              fill="hsl(var(--destructive))" 
              radius={[0, 0, 0, 0]}
              name="active"
            />
            <Bar 
              dataKey="cancelled" 
              stackId="evasions"
              fill="hsl(var(--muted-foreground))" 
              radius={[4, 4, 0, 0]}
              name="cancelled"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
