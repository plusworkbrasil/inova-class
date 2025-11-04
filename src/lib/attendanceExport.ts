import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { StudentAttendanceRow } from '@/hooks/useInstructorSubjectAttendance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportOptions {
  subjectName: string;
  className: string;
  students: StudentAttendanceRow[];
  dates: string[];
}

const formatDate = (dateStr: string, formatStr: string = 'dd/MM') => {
  try {
    return format(new Date(dateStr), formatStr, { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const generateAttendanceHTML = ({
  subjectName,
  className,
  students,
  dates
}: ExportOptions): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="text-align: center; color: #333; margin-bottom: 10px;">Relatório de Frequência</h1>
      <h2 style="text-align: center; color: #666; margin-bottom: 5px;">${subjectName} - ${className}</h2>
      <p style="text-align: center; color: #888; margin-bottom: 20px;">Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; min-width: 150px;">Aluno</th>
            ${dates.map(date => `<th style="border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 9px;">${formatDate(date)}</th>`).join('')}
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; min-width: 60px;">% Presença</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${student.student_name}</td>
              ${dates.map(date => {
                const status = student.attendance_by_date[date]?.status;
                const bgColor = status === 'present' ? '#d4edda' : status === 'absent' ? '#f8d7da' : '#fff';
                const text = status === 'present' ? 'C' : status === 'absent' ? 'F' : '-';
                return `<td style="border: 1px solid #ddd; padding: 6px; text-align: center; background-color: ${bgColor}; font-weight: bold;">${text}</td>`;
              }).join('')}
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
                ${student.attendance_percentage.toFixed(0)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; border-left: 4px solid #666;">
        <p style="margin: 5px 0; font-weight: bold;">Legenda:</p>
        <p style="margin: 5px 0;">C = Compareceu | F = Faltou | - = Sem registro</p>
        <p style="margin: 5px 0;">Total de alunos: ${students.length}</p>
        <p style="margin: 5px 0;">Total de chamadas realizadas: ${dates.length}</p>
      </div>
    </div>
  `;
};

export const exportAttendanceMatrixToPDF = async ({
  subjectName,
  className,
  students,
  dates
}: ExportOptions) => {
  const element = document.createElement('div');
  element.innerHTML = generateAttendanceHTML({
    subjectName,
    className,
    students,
    dates
  });

  const options = {
    margin: [10, 10, 10, 10],
    filename: `Frequencia_${subjectName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: dates.length > 15 ? 'landscape' : 'portrait' 
    }
  };

  await html2pdf().set(options).from(element).save();
};

export const exportAttendanceMatrixToExcel = ({
  subjectName,
  className,
  students,
  dates
}: ExportOptions) => {
  const header = [
    'Aluno',
    'Número',
    ...dates.map(date => formatDate(date, 'dd/MM/yyyy')),
    'Total Presenças',
    'Total Faltas',
    '% Presença'
  ];

  const rows = students.map(student => [
    student.student_name,
    student.student_number || '-',
    ...dates.map(date => {
      const status = student.attendance_by_date[date]?.status;
      return status === 'present' ? 'C' : status === 'absent' ? 'F' : '-';
    }),
    student.total_present,
    student.total_absent,
    `${student.attendance_percentage.toFixed(1)}%`
  ]);

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [
    { wch: 25 },
    { wch: 10 },
    ...dates.map(() => ({ wch: 8 })),
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Frequência');

  const metaWs = XLSX.utils.aoa_to_sheet([
    ['Relatório de Frequência'],
    [''],
    ['Disciplina:', subjectName],
    ['Turma:', className],
    ['Data de geração:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
    [''],
    ['Legenda:'],
    ['C = Compareceu'],
    ['F = Faltou'],
    ['- = Sem registro'],
    [''],
    ['Estatísticas:'],
    [`Total de alunos: ${students.length}`],
    [`Total de chamadas: ${dates.length}`]
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, 'Informações');

  const filename = `Frequencia_${subjectName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(wb, filename);
};
