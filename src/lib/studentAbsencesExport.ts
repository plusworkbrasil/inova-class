import html2pdf from 'html2pdf.js';
import { StudentWithExcessAbsences } from '@/hooks/useStudentsWithExcessAbsences';

const getSeverityColor = (absences: number): string => {
  if (absences >= 10) return '#ef4444'; // red-500
  if (absences >= 7) return '#f97316'; // orange-500
  return '#eab308'; // yellow-500
};

const getSeverityLabel = (absences: number): string => {
  if (absences >= 10) return 'Crítico';
  if (absences >= 7) return 'Alerta';
  return 'Atenção';
};

export const exportStudentAbsencesToPDF = async (
  data: StudentWithExcessAbsences[],
  className?: string
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div style="padding: 40px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">
          Relatório de Alunos com Excesso de Faltas
        </h1>
        ${className ? `<h2 style="margin: 10px 0 0 0; font-size: 18px; color: #666;">Turma: ${className}</h2>` : ''}
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
          Gerado em ${dateStr} às ${timeStr}
        </p>
      </div>

      <!-- Summary -->
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1a1a1a;">Resumo</h3>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">
          <strong>Total de alunos:</strong> ${data.length}
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #999;">
          Alunos com mais de 3 faltas em disciplinas ativas
        </p>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #1a1a1a; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Nome</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Matrícula</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Turma</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Disciplina</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Faltas</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Total Aulas</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">% Faltas</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Severidade</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((student, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
            const severityColor = getSeverityColor(student.total_absences);
            const severityLabel = getSeverityLabel(student.total_absences);
            
            return `
              <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${student.student_name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${student.student_enrollment}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${student.class_name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${student.subject_name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: ${severityColor};">
                  ${student.total_absences}
                </td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${student.total_classes}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${student.absence_percentage}%</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                  <span style="background: ${severityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                    ${severityLabel}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center;">
        <p style="margin: 0;">Sistema de Gestão Escolar - Relatório gerado automaticamente</p>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = html;

  const opt = {
    margin: 10,
    filename: `Alunos_Faltosos${className ? `_${className}` : ''}_${now.toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  await html2pdf().set(opt).from(element).save();
};
