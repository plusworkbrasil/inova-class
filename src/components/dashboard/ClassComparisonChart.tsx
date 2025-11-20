import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useClassComparison } from "@/hooks/useClassComparison";
import { Skeleton } from "@/components/ui/skeleton";

export const ClassComparisonChart = () => {
  const { data: classMetrics, isLoading } = useClassComparison();

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!classMetrics || classMetrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  // Filter classes with students and prepare chart data
  const chartData = classMetrics
    .filter(c => c.totalStudents > 0)
    .map(c => ({
      name: c.name,
      'Frequência (%)': c.attendanceRate,
      'Média de Notas': c.avgGrade !== null ? c.avgGrade : 0,
    }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            className="text-xs"
          />
          <YAxis 
            domain={[0, 100]}
            className="text-xs"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar 
            dataKey="Frequência (%)" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="Média de Notas" 
            fill="hsl(var(--chart-2))" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
