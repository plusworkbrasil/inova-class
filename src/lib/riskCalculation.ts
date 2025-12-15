// Cálculo de pontuação de risco para alunos

export interface RiskIndicators {
  attendancePercentage: number;
  gradeAverage: number;
  absencesLast30Days: number;
  missedActivities: number;
  classEvasionRate?: number;
  pendingDeclarations?: number;
}

export interface RiskResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export const calculateRiskScore = (indicators: RiskIndicators): RiskResult => {
  let score = 0;
  const factors: string[] = [];

  // Frequência (peso máximo: 35 pontos)
  if (indicators.attendancePercentage < 60) {
    score += 35;
    factors.push('Frequência crítica (< 60%)');
  } else if (indicators.attendancePercentage < 70) {
    score += 25;
    factors.push('Frequência muito baixa (< 70%)');
  } else if (indicators.attendancePercentage < 75) {
    score += 20;
    factors.push('Frequência abaixo do mínimo (< 75%)');
  } else if (indicators.attendancePercentage < 80) {
    score += 10;
    factors.push('Frequência em atenção (< 80%)');
  }

  // Média de notas (peso máximo: 25 pontos)
  if (indicators.gradeAverage < 4) {
    score += 25;
    factors.push('Média crítica (< 4.0)');
  } else if (indicators.gradeAverage < 5) {
    score += 18;
    factors.push('Média abaixo da aprovação (< 5.0)');
  } else if (indicators.gradeAverage < 6) {
    score += 10;
    factors.push('Média baixa (< 6.0)');
  }

  // Faltas nos últimos 30 dias (peso máximo: 20 pontos)
  if (indicators.absencesLast30Days >= 10) {
    score += 20;
    factors.push('Muitas faltas recentes (10+)');
  } else if (indicators.absencesLast30Days >= 7) {
    score += 15;
    factors.push('Faltas frequentes recentes (7+)');
  } else if (indicators.absencesLast30Days >= 5) {
    score += 10;
    factors.push('Faltas acumulando (5+)');
  } else if (indicators.absencesLast30Days >= 3) {
    score += 5;
    factors.push('Faltas recentes em atenção (3+)');
  }

  // Atividades perdidas (peso máximo: 10 pontos)
  if (indicators.missedActivities >= 5) {
    score += 10;
    factors.push('Muitas atividades perdidas (5+)');
  } else if (indicators.missedActivities >= 3) {
    score += 6;
    factors.push('Atividades pendentes (3+)');
  }

  // Taxa de evasão da turma (peso máximo: 10 pontos)
  if (indicators.classEvasionRate && indicators.classEvasionRate > 15) {
    score += 10;
    factors.push('Turma com alta evasão (> 15%)');
  } else if (indicators.classEvasionRate && indicators.classEvasionRate > 10) {
    score += 5;
    factors.push('Turma com evasão elevada (> 10%)');
  }

  // Garantir que não ultrapasse 100
  score = Math.min(score, 100);

  // Determinar nível de risco
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 76) {
    level = 'critical';
  } else if (score >= 51) {
    level = 'high';
  } else if (score >= 26) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { score, level, factors };
};

export const getRiskLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    critical: 'Crítico'
  };
  return labels[level] || level;
};

export const getRiskLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  return colors[level] || 'text-muted-foreground';
};

export const getRiskLevelBadgeVariant = (level: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (level === 'critical' || level === 'high') return 'destructive';
  if (level === 'medium') return 'secondary';
  return 'outline';
};

export const getInterventionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    phone_call: 'Ligação Telefônica',
    meeting: 'Reunião Presencial',
    family_contact: 'Contato com Família',
    academic_support: 'Apoio Acadêmico',
    psychological_support: 'Apoio Psicológico',
    financial_support: 'Apoio Financeiro',
    home_visit: 'Visita Domiciliar',
    other: 'Outro'
  };
  return labels[type] || type;
};

export const getOutcomeLabel = (outcome: string | null): string => {
  if (!outcome) return 'Pendente';
  const labels: Record<string, string> = {
    positive: 'Positivo',
    neutral: 'Neutro',
    negative: 'Negativo',
    pending: 'Pendente'
  };
  return labels[outcome] || outcome;
};

export const getOutcomeColor = (outcome: string | null): string => {
  if (!outcome || outcome === 'pending') return 'text-muted-foreground';
  const colors: Record<string, string> = {
    positive: 'text-green-600',
    neutral: 'text-yellow-600',
    negative: 'text-red-600'
  };
  return colors[outcome] || 'text-muted-foreground';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Ativo',
    monitoring: 'Em Monitoramento',
    resolved: 'Resolvido',
    evaded: 'Evadiu'
  };
  return labels[status] || status;
};
