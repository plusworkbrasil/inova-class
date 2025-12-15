import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EvasionData {
  id: string;
  date: string;
  reason: string;
  status: string;
  observations?: string | null;
  created_at: string;
  profiles?: {
    name?: string;
    class_id?: string;
  };
  reporter_profile?: {
    name?: string;
  };
  class_name?: string;
}

interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  reason?: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

export const exportEvasionsToExcel = (
  evasions: EvasionData[],
  classes: ClassInfo[],
  filters: ExportFilters
) => {
  // Criar mapa de turmas para lookup rápido
  const classMap = new Map(classes.map(c => [c.id, c.name]));

  // Preparar dados para a planilha principal
  const evasionsData = evasions.map(evasion => ({
    'Aluno': evasion.profiles?.name || 'N/A',
    'Turma': evasion.profiles?.class_id ? classMap.get(evasion.profiles.class_id) || 'N/A' : 'N/A',
    'Data da Evasão': format(new Date(evasion.date), 'dd/MM/yyyy', { locale: ptBR }),
    'Motivo': evasion.reason,
    'Status': evasion.status === 'active' ? 'Ativa' : 'Cancelada',
    'Observações': evasion.observations || '-',
    'Registrado por': evasion.reporter_profile?.name || 'N/A',
    'Data do Registro': format(new Date(evasion.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  }));

  // Calcular estatísticas
  const totalEvasions = evasions.length;
  const activeEvasions = evasions.filter(e => e.status === 'active').length;
  const cancelledEvasions = evasions.filter(e => e.status === 'cancelled').length;

  // Evasões por motivo
  const byReason = evasions.reduce((acc, curr) => {
    acc[curr.reason] = (acc[curr.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Evasões por turma
  const byClass = evasions.reduce((acc, curr) => {
    const className = curr.profiles?.class_id ? classMap.get(curr.profiles.class_id) || 'Sem turma' : 'Sem turma';
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Evasões por mês
  const byMonth = evasions.reduce((acc, curr) => {
    const monthYear = format(new Date(curr.date), 'MMMM/yyyy', { locale: ptBR });
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Preparar dados de estatísticas
  const statsData: { Métrica: string; Valor: string | number }[] = [
    { Métrica: 'Total de Evasões', Valor: totalEvasions },
    { Métrica: 'Evasões Ativas', Valor: activeEvasions },
    { Métrica: 'Evasões Canceladas', Valor: cancelledEvasions },
    { Métrica: '', Valor: '' },
    { Métrica: '--- POR MOTIVO ---', Valor: '' },
  ];

  Object.entries(byReason)
    .sort(([, a], [, b]) => b - a)
    .forEach(([reason, count]) => {
      const percentage = ((count / totalEvasions) * 100).toFixed(1);
      statsData.push({ Métrica: reason, Valor: `${count} (${percentage}%)` });
    });

  statsData.push({ Métrica: '', Valor: '' });
  statsData.push({ Métrica: '--- POR TURMA ---', Valor: '' });

  Object.entries(byClass)
    .sort(([, a], [, b]) => b - a)
    .forEach(([className, count]) => {
      statsData.push({ Métrica: className, Valor: count });
    });

  statsData.push({ Métrica: '', Valor: '' });
  statsData.push({ Métrica: '--- POR MÊS ---', Valor: '' });

  Object.entries(byMonth)
    .forEach(([month, count]) => {
      statsData.push({ Métrica: month, Valor: count });
    });

  // Preparar informações do relatório
  const infoData = [
    { Campo: 'Data de Geração', Valor: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) },
    { Campo: 'Total de Registros', Valor: totalEvasions },
    { Campo: 'Período - Início', Valor: filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido' },
    { Campo: 'Período - Fim', Valor: filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definido' },
    { Campo: 'Filtro de Motivo', Valor: filters.reason || 'Todos' },
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Evasões
  const wsEvasions = XLSX.utils.json_to_sheet(evasionsData);
  
  // Ajustar largura das colunas
  wsEvasions['!cols'] = [
    { wch: 30 }, // Aluno
    { wch: 20 }, // Turma
    { wch: 15 }, // Data da Evasão
    { wch: 25 }, // Motivo
    { wch: 12 }, // Status
    { wch: 40 }, // Observações
    { wch: 25 }, // Registrado por
    { wch: 18 }, // Data do Registro
  ];

  XLSX.utils.book_append_sheet(wb, wsEvasions, 'Evasões');

  // Sheet 2: Estatísticas
  const wsStats = XLSX.utils.json_to_sheet(statsData);
  wsStats['!cols'] = [
    { wch: 30 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');

  // Sheet 3: Informações
  const wsInfo = XLSX.utils.json_to_sheet(infoData);
  wsInfo['!cols'] = [
    { wch: 20 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações');

  // Gerar nome do arquivo
  const startStr = filters.startDate ? format(filters.startDate, 'dd-MM-yyyy', { locale: ptBR }) : 'inicio';
  const endStr = filters.endDate ? format(filters.endDate, 'dd-MM-yyyy', { locale: ptBR }) : 'fim';
  const fileName = `Evasoes_${startStr}_a_${endStr}.xlsx`;

  // Salvar arquivo
  XLSX.writeFile(wb, fileName);
};
