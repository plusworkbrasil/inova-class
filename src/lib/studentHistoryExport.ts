import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StudentSearchResult } from '@/hooks/useStudentSearch';
import { StudentHistoryData } from '@/hooks/useStudentHistory';

interface ExportStudentHistoryOptions {
  student: StudentSearchResult;
  historyData: StudentHistoryData;
}

const generateStudentHistoryHTML = ({
  student,
  historyData
}: ExportStudentHistoryOptions): string => {
  // Calcular estatísticas gerais
  const totalPresent = historyData.attendance.filter((a: any) => a.is_present).length;
  const totalAbsent = historyData.attendance.filter((a: any) => a.is_present === false).length;
  const attendancePercentage = historyData.attendance.length > 0 
    ? ((totalPresent / historyData.attendance.length) * 100).toFixed(1)
    : '0';

  return `
    <div style="font-family: Arial, sans-serif; padding: 30px; color: #333;">
      <!-- Cabeçalho -->
      <div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #222; font-size: 24px;">Histórico Acadêmico do Aluno</h1>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
          Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <!-- Informações do Aluno -->
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #666; padding-bottom: 8px;">
          Dados do Aluno
        </h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Nome:</strong></td>
            <td style="padding: 5px 0;">${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; width: 30%;"><strong>Matrícula:</strong></td>
            <td style="padding: 5px 0;">${student.student_id || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Número de Matrícula:</strong></td>
            <td style="padding: 5px 0;">${student.enrollment_number || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Turma:</strong></td>
            <td style="padding: 5px 0;">${student.class_name || 'Não definida'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Status:</strong></td>
            <td style="padding: 5px 0;">${student.status === 'active' ? 'Ativo' : 'Inativo'}</td>
          </tr>
        </table>
      </div>

      <!-- Resumo Geral -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #666; padding-bottom: 8px;">
          Resumo Geral
        </h2>
        <div style="display: flex; justify-content: space-between; gap: 15px;">
          <div style="flex: 1; background-color: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">Total de Disciplinas</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #1976d2;">${historyData.subjects.size}</p>
          </div>
          <div style="flex: 1; background-color: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">Total de Notas</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #f57c00;">${historyData.grades.length}</p>
          </div>
          <div style="flex: 1; background-color: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">Registros de Frequência</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #388e3c;">${historyData.attendance.length}</p>
          </div>
          <div style="flex: 1; background-color: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">Taxa de Presença</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #7b1fa2;">${attendancePercentage}%</p>
          </div>
        </div>
      </div>

      <!-- Desempenho por Disciplina -->
      ${historyData.subjects.size > 0 ? `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #666; padding-bottom: 8px;">
            Desempenho por Disciplina
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Disciplina</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Média</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Notas Registradas</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Frequência</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from(historyData.subjects.entries()).map(([subjectId, subject]) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px;">${subject.name}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: ${subject.grade_average >= 7 ? '#4caf50' : subject.grade_average >= 5 ? '#ff9800' : '#f44336'};">
                    ${subject.total_grades > 0 ? subject.grade_average.toFixed(1) : '-'}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${subject.total_grades}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${subject.attendance_count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Histórico de Notas -->
      ${historyData.grades.length > 0 ? `
        <div style="margin-bottom: 30px; page-break-before: always;">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #666; padding-bottom: 8px;">
            Histórico de Notas
          </h2>
          ${historyData.grades.map((grade: any) => {
            const percentage = (grade.value / grade.max_value) * 10;
            const color = percentage >= 7 ? '#4caf50' : percentage >= 5 ? '#ff9800' : '#f44336';
            return `
              <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${grade.subjects.name}</p>
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                      <strong>Tipo:</strong> ${grade.type}
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                      <strong>Data:</strong> ${format(new Date(grade.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    ${grade.observations ? `
                      <p style="margin: 10px 0 0 0; font-size: 11px; color: #555; font-style: italic; background-color: #f9f9f9; padding: 8px; border-radius: 4px;">
                        <strong>Observações:</strong> ${grade.observations}
                      </p>
                    ` : ''}
                  </div>
                  <div style="text-align: right; min-width: 100px;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${color};">
                      ${grade.value.toFixed(1)}/${grade.max_value.toFixed(1)}
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">
                      ${percentage.toFixed(1)} pontos
                    </p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- Histórico de Frequência -->
      ${historyData.attendance.length > 0 ? `
        <div style="margin-bottom: 30px; page-break-before: always;">
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #666; padding-bottom: 8px;">
            Histórico de Frequência
          </h2>
          ${historyData.attendance.map((record: any) => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${record.subject_name}</p>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                    <strong>Turma:</strong> ${record.class_name}
                  </p>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                    <strong>Data:</strong> ${format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  ${record.justification ? `
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #555; font-style: italic; background-color: #f9f9f9; padding: 8px; border-radius: 4px;">
                      <strong>Justificativa:</strong> ${record.justification}
                    </p>
                  ` : ''}
                </div>
                <div>
                  <span style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; background-color: ${record.is_present ? '#4caf50' : '#f44336'}; color: white;">
                    ${record.is_present ? '✓ Presente' : '✗ Ausente'}
                  </span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Rodapé -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #888; font-size: 11px;">
        <p style="margin: 0;">Este documento foi gerado automaticamente pelo Sistema de Gestão Acadêmica</p>
        <p style="margin: 5px 0 0 0;">Data de emissão: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  `;
};

export const exportStudentHistoryToPDF = async ({
  student,
  historyData
}: ExportStudentHistoryOptions) => {
  const element = document.createElement('div');
  element.innerHTML = generateStudentHistoryHTML({
    student,
    historyData
  });

  const options = {
    margin: [15, 15, 15, 15],
    filename: `Historico_${student.name.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true 
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().set(options).from(element).save();
};
