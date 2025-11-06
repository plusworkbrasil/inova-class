import { useMemo } from 'react';
import { StudentHistoryData } from './useStudentHistory';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface GradesChartData {
  date: string;
  grade: number;
  subject: string;
  month: string;
}

export interface AttendanceChartData {
  month: string;
  presente: number;
  ausente: number;
  total: number;
  percentualPresenca: number;
}

export interface SubjectPerformanceData {
  name: string;
  media: number;
  frequencia: number;
}

export const useStudentHistoryCharts = (historyData: StudentHistoryData | null) => {
  // Processar notas ao longo do tempo
  const gradesOverTime = useMemo(() => {
    if (!historyData?.grades.length) return [];

    return historyData.grades
      .map((grade: any) => ({
        date: grade.date,
        grade: (grade.value / grade.max_value) * 10,
        subject: grade.subjects.name,
        month: format(parseISO(grade.date), 'MMM/yy', { locale: ptBR })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [historyData]);

  // Processar frequência mensal
  const attendanceByMonth = useMemo(() => {
    if (!historyData?.attendance.length) return [];

    const monthlyData = new Map<string, { presente: number; ausente: number }>();

    historyData.attendance.forEach((record: any) => {
      const monthKey = format(parseISO(record.date), 'MMM/yy', { locale: ptBR });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { presente: 0, ausente: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      if (record.is_present) {
        data.presente++;
      } else {
        data.ausente++;
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => {
        const total = data.presente + data.ausente;
        return {
          month,
          presente: data.presente,
          ausente: data.ausente,
          total,
          percentualPresenca: total > 0 ? (data.presente / total) * 100 : 0
        };
      })
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split('/');
        const [monthB, yearB] = b.month.split('/');
        const dateA = new Date(2000 + parseInt(yearA), new Date(`${monthA} 1`).getMonth());
        const dateB = new Date(2000 + parseInt(yearB), new Date(`${monthB} 1`).getMonth());
        return dateA.getTime() - dateB.getTime();
      });
  }, [historyData]);

  // Processar desempenho por disciplina
  const subjectPerformance = useMemo(() => {
    if (!historyData?.subjects.size) return [];

    return Array.from(historyData.subjects.entries()).map(([id, subject]) => ({
      name: subject.name.length > 20 
        ? subject.name.substring(0, 20) + '...' 
        : subject.name,
      media: subject.total_grades > 0 ? subject.grade_average : 0,
      frequencia: subject.attendance_count
    }));
  }, [historyData]);

  // Média geral ao longo do tempo (agregado mensal)
  const averageGradesByMonth = useMemo(() => {
    if (!gradesOverTime.length) return [];

    const monthlyGrades = new Map<string, { sum: number; count: number }>();

    gradesOverTime.forEach((grade) => {
      if (!monthlyGrades.has(grade.month)) {
        monthlyGrades.set(grade.month, { sum: 0, count: 0 });
      }
      const data = monthlyGrades.get(grade.month)!;
      data.sum += grade.grade;
      data.count++;
    });

    return Array.from(monthlyGrades.entries())
      .map(([month, data]) => ({
        month,
        media: data.sum / data.count
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split('/');
        const [monthB, yearB] = b.month.split('/');
        const dateA = new Date(2000 + parseInt(yearA), new Date(`${monthA} 1`).getMonth());
        const dateB = new Date(2000 + parseInt(yearB), new Date(`${monthB} 1`).getMonth());
        return dateA.getTime() - dateB.getTime();
      });
  }, [gradesOverTime]);

  return {
    gradesOverTime,
    attendanceByMonth,
    subjectPerformance,
    averageGradesByMonth
  };
};
