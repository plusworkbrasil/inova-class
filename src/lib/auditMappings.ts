export const actionMappings: Record<string, string> = {
  'VIEW': 'Visualizar',
  'VIEW_MEDICAL': 'Visualizar Dados Médicos',
  'VIEW_PERSONAL': 'Visualizar Dados Pessoais',
  'UPDATE': 'Atualizar',
  'CREATE': 'Criar',
  'DELETE': 'Deletar',
  'INSERT': 'Inserir',
  'SELECT': 'Consultar',
  'LOGIN': 'Login',
  'LOGOUT': 'Logout',
  'ACCESS': 'Acessar'
};

export const tableMappings: Record<string, string> = {
  'profiles': 'Usuários',
  'classes': 'Turmas',
  'subjects': 'Disciplinas',
  'attendance': 'Frequência',
  'grades': 'Notas',
  'communications': 'Comunicações',
  'declarations': 'Declarações',
  'evasions': 'Evasões',
  'equipment': 'Equipamentos',
  'audit_logs': 'Logs de Auditoria',
  'system_settings': 'Configurações do Sistema'
};

export const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (action) {
    case 'VIEW':
    case 'SELECT':
    case 'ACCESS':
      return 'outline';
    case 'VIEW_MEDICAL':
    case 'VIEW_PERSONAL':
      return 'secondary';
    case 'CREATE':
    case 'INSERT':
      return 'default';
    case 'UPDATE':
      return 'secondary';
    case 'DELETE':
      return 'destructive';
    case 'LOGIN':
    case 'LOGOUT':
      return 'outline';
    default:
      return 'outline';
  }
};

export const translateAction = (action: string): string => {
  return actionMappings[action] || action;
};

export const translateTable = (tableName: string): string => {
  return tableMappings[tableName] || tableName;
};