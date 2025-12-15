import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';

interface EvasionData {
  id: string;
  date: string;
  reason: string;
  status: string;
  observations?: string | null;
  profiles?: {
    name?: string;
    class_id?: string;
  };
  reporter_profile?: {
    name?: string;
  };
  created_at: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface ExportFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  reason?: string;
  classId?: string;
}

const translateReason = (reason: string): string => {
  const translations: Record<string, string> = {
    'financial': 'Dificuldades Financeiras',
    'health': 'Problemas de Saúde',
    'work': 'Conflito com Trabalho',
    'personal': 'Motivos Pessoais',
    'relocation': 'Mudança de Cidade',
    'other': 'Outros'
  };
  return translations[reason] || reason;
};

const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'active': 'Ativa',
    'cancelled': 'Cancelada'
  };
  return translations[status] || status;
};

export const exportEvasionsToPdf = async (
  evasions: EvasionData[],
  classes: ClassInfo[],
  filters: ExportFilters
) => {
  const classMap = new Map(classes.map(c => [c.id, c.name]));
  
  // Calculate statistics
  const totalEvasions = evasions.length;
  const activeEvasions = evasions.filter(e => e.status === 'active').length;
  const cancelledEvasions = evasions.filter(e => e.status === 'cancelled').length;
  
  const reasonCounts: Record<string, number> = {};
  const classCounts: Record<string, number> = {};
  
  evasions.forEach(e => {
    const reason = translateReason(e.reason);
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    
    const className = classMap.get(e.profiles?.class_id || '') || 'Sem Turma';
    classCounts[className] = (classCounts[className] || 0) + 1;
  });

  // Build HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #333; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 18px; margin-bottom: 5px; }
        .header p { font-size: 10px; color: #666; }
        .filters { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
        .filters h3 { font-size: 12px; margin-bottom: 8px; }
        .filters p { font-size: 10px; margin-bottom: 3px; }
        .stats { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .stat-box { background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px; }
        .stat-box:first-child { margin-left: 0; }
        .stat-box:last-child { margin-right: 0; }
        .stat-box h4 { font-size: 10px; color: #666; margin-bottom: 5px; }
        .stat-box p { font-size: 16px; font-weight: bold; }
        .stat-box.total p { color: #333; }
        .stat-box.active p { color: #dc2626; }
        .stat-box.cancelled p { color: #16a34a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #333; color: white; padding: 8px 5px; text-align: left; font-size: 10px; }
        td { padding: 6px 5px; border-bottom: 1px solid #ddd; font-size: 10px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .status-active { color: #dc2626; font-weight: bold; }
        .status-cancelled { color: #16a34a; }
        .section { margin-bottom: 15px; }
        .section h3 { font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .stats-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .stats-item { background: #f5f5f5; padding: 8px; border-radius: 4px; min-width: 120px; }
        .stats-item span { font-size: 10px; color: #666; }
        .stats-item strong { display: block; font-size: 12px; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Relatório de Evasões</h1>
        <p>Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      <div class="filters">
        <h3>📌 Filtros Aplicados</h3>
        <p><strong>Período:</strong> ${filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Início'} a ${filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Hoje'}</p>
        ${filters.reason ? `<p><strong>Motivo:</strong> ${translateReason(filters.reason)}</p>` : ''}
        ${filters.classId ? `<p><strong>Turma:</strong> ${classMap.get(filters.classId) || 'N/A'}</p>` : ''}
        <p><strong>Total de Registros:</strong> ${totalEvasions}</p>
      </div>

      <div class="stats">
        <div class="stat-box total">
          <h4>Total de Evasões</h4>
          <p>${totalEvasions}</p>
        </div>
        <div class="stat-box active">
          <h4>Evasões Ativas</h4>
          <p>${activeEvasions}</p>
        </div>
        <div class="stat-box cancelled">
          <h4>Canceladas</h4>
          <p>${cancelledEvasions}</p>
        </div>
      </div>

      <div class="section">
        <h3>📊 Evasões por Motivo</h3>
        <div class="stats-grid">
          ${Object.entries(reasonCounts).map(([reason, count]) => `
            <div class="stats-item">
              <span>${reason}</span>
              <strong>${count} (${((count / totalEvasions) * 100).toFixed(0)}%)</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h3>🏫 Evasões por Turma</h3>
        <div class="stats-grid">
          ${Object.entries(classCounts).slice(0, 6).map(([className, count]) => `
            <div class="stats-item">
              <span>${className}</span>
              <strong>${count}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h3>📋 Lista de Evasões</h3>
        <table>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Turma</th>
              <th>Data</th>
              <th>Motivo</th>
              <th>Status</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            ${evasions.map(e => `
              <tr>
                <td>${e.profiles?.name || 'N/A'}</td>
                <td>${classMap.get(e.profiles?.class_id || '') || 'N/A'}</td>
                <td>${format(new Date(e.date), 'dd/MM/yyyy')}</td>
                <td>${translateReason(e.reason)}</td>
                <td class="${e.status === 'active' ? 'status-active' : 'status-cancelled'}">${translateStatus(e.status)}</td>
                <td>${e.reporter_profile?.name || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        Sistema de Gestão Educacional • Relatório gerado automaticamente
      </div>
    </body>
    </html>
  `;

  // Generate PDF
  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.appendChild(element);

  const options = {
    margin: 10,
    filename: `Evasoes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    document.body.removeChild(element);
  }
};
