import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { StudentGradeRow } from '@/hooks/useInstructorSubjectGrades';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportOptions {
  subjectName: string;
  className: string;
  students: StudentGradeRow[];
  evaluationTypes: string[];
}

const formatDate = (dateStr: string, formatStr: string = 'dd/MM') => {
  try {
    return format(new Date(dateStr), formatStr, { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const generateGradesHTML = ({
  subjectName,
  className,
  students,
  evaluationTypes
}: ExportOptions): string => {
  const totalStudents = students.length;
  const approvedCount = students.filter(s => s.status === 'approved').length;
  const failedCount = students.filter(s => s.status === 'failed').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;
  const classAverage = students.reduce((sum, s) => sum + s.average, 0) / (totalStudents || 1);

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="text-align: center; color: #333; margin-bottom: 10px;">Relatório de Notas</h1>
      <h2 style="text-align: center; color: #666; margin-bottom: 5px;">${subjectName} - ${className}</h2>
      <p style="text-align: center; color: #888; margin-bottom: 20px;">Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; min-width: 150px;">Aluno</th>
            ${evaluationTypes.map(type => `<th style="border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 9px;">${type}</th>`).join('')}
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; min-width: 60px;">Média</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; min-width: 70px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => {
            const statusColor = student.status === 'approved' ? '#d4edda' : student.status === 'failed' ? '#f8d7da' : '#fff3cd';
            const statusText = student.status === 'approved' ? 'Aprovado' : student.status === 'failed' ? 'Reprovado' : 'Pendente';
            
            return `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${student.student_name}</td>
                ${evaluationTypes.map(type => {
                  const grades = student.grades_by_type[type] || [];
                  if (grades.length === 0) {
                    return `<td style="border: 1px solid #ddd; padding: 6px; text-align: center; color: #999;">-</td>`;
                  }
                  const gradesText = grades.map(g => `${g.value.toFixed(1)}/${g.max_value.toFixed(1)}`).join('<br>');
                  return `<td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 9px;">${gradesText}</td>`;
                }).join('')}
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
                  ${student.average.toFixed(1)}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: ${statusColor}; font-weight: bold; font-size: 9px;">
                  ${statusText}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; border-left: 4px solid #666;">
        <p style="margin: 5px 0; font-weight: bold;">Estatísticas da Turma:</p>
        <p style="margin: 5px 0;">Total de alunos: ${totalStudents}</p>
        <p style="margin: 5px 0;">Média geral da turma: ${classAverage.toFixed(1)}</p>
        <p style="margin: 5px 0; color: #28a745;">Aprovados: ${approvedCount} (${((approvedCount / totalStudents) * 100).toFixed(0)}%)</p>
        <p style="margin: 5px 0; color: #dc3545;">Reprovados: ${failedCount} (${((failedCount / totalStudents) * 100).toFixed(0)}%)</p>
        <p style="margin: 5px 0; color: #ffc107;">Pendentes: ${pendingCount} (${((pendingCount / totalStudents) * 100).toFixed(0)}%)</p>
        <p style="margin: 10px 0 5px 0; font-weight: bold;">Critérios:</p>
        <p style="margin: 5px 0;">Aprovado: Média ≥ 7.0 | Reprovado: Média < 7.0 | Pendente: Sem notas</p>
      </div>
    </div>
  `;
};

export const exportGradesMatrixToPDF = async ({
  subjectName,
  className,
  students,
  evaluationTypes
}: ExportOptions) => {
  const element = document.createElement('div');
  element.innerHTML = generateGradesHTML({
    subjectName,
    className,
    students,
    evaluationTypes
  });

  const options = {
    margin: [10, 10, 10, 10],
    filename: `Notas_${subjectName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: evaluationTypes.length > 5 ? 'landscape' : 'portrait' 
    }
  };

  await html2pdf().set(options).from(element).save();
};

export const exportGradesMatrixToExcel = ({
  subjectName,
  className,
  students,
  evaluationTypes
}: ExportOptions) => {
  // Sheet principal com notas
  const header = [
    'Aluno',
    'Número',
    ...evaluationTypes,
    'Média',
    'Status'
  ];

  const rows = students.map(student => [
    student.student_name,
    student.student_number || '-',
    ...evaluationTypes.map(type => {
      const grades = student.grades_by_type[type] || [];
      if (grades.length === 0) return '-';
      return grades.map(g => `${g.value.toFixed(1)}/${g.max_value.toFixed(1)}`).join('; ');
    }),
    student.average.toFixed(1),
    student.status === 'approved' ? 'Aprovado' : student.status === 'failed' ? 'Reprovado' : 'Pendente'
  ]);

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [
    { wch: 25 },
    { wch: 10 },
    ...evaluationTypes.map(() => ({ wch: 15 })),
    { wch: 10 },
    { wch: 12 }
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Notas');

  // Sheet de informações
  const totalStudents = students.length;
  const approvedCount = students.filter(s => s.status === 'approved').length;
  const failedCount = students.filter(s => s.status === 'failed').length;
  const pendingCount = students.filter(s => s.status === 'pending').length;
  const classAverage = students.reduce((sum, s) => sum + s.average, 0) / (totalStudents || 1);

  const metaWs = XLSX.utils.aoa_to_sheet([
    ['Relatório de Notas'],
    [''],
    ['Disciplina:', subjectName],
    ['Turma:', className],
    ['Data de geração:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
    [''],
    ['Estatísticas da Turma:'],
    [`Total de alunos: ${totalStudents}`],
    [`Média geral: ${classAverage.toFixed(1)}`],
    [`Aprovados: ${approvedCount} (${((approvedCount / totalStudents) * 100).toFixed(0)}%)`],
    [`Reprovados: ${failedCount} (${((failedCount / totalStudents) * 100).toFixed(0)}%)`],
    [`Pendentes: ${pendingCount} (${((pendingCount / totalStudents) * 100).toFixed(0)}%)`],
    [''],
    ['Critérios:'],
    ['Aprovado: Média ≥ 7.0'],
    ['Reprovado: Média < 7.0'],
    ['Pendente: Sem notas registradas']
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, 'Informações');

  // Sheet detalhada por tipo de avaliação
  const detailsData: any[][] = [['Aluno', 'Tipo de Avaliação', 'Nota', 'Valor Máximo', 'Data', 'Observações']];
  
  students.forEach(student => {
    evaluationTypes.forEach(type => {
      const grades = student.grades_by_type[type] || [];
      grades.forEach(grade => {
        detailsData.push([
          student.student_name,
          type,
          grade.value.toFixed(1),
          grade.max_value.toFixed(1),
          formatDate(grade.date, 'dd/MM/yyyy'),
          grade.observations || ''
        ]);
      });
    });
  });

  const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Detalhes');

  const filename = `Notas_${subjectName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(wb, filename);
};
