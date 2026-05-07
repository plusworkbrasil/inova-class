export const actionMappings: Record<string, string> = {
  VIEW: 'Visualizar',
  VIEW_MEDICAL: 'Visualizar Dados Médicos',
  VIEW_PERSONAL: 'Visualizar Dados Pessoais',
  UPDATE: 'Atualizar',
  CREATE: 'Criar',
  DELETE: 'Deletar',
  INSERT: 'Inserir',
  SELECT: 'Consultar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  ACCESS: 'Acessar',
  RECORD_CREATED: 'Registro criado',
  RECORD_UPDATED: 'Registro atualizado',
  RECORD_DELETED: 'Registro deletado',
  ACCOUNT_AUTO_BLOCKED: 'Conta bloqueada automaticamente',
  ACCOUNT_UNBLOCKED: 'Conta desbloqueada',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'Tentativa de acesso não autorizado',
  BLOCKED_ADMIN_FIELD_UPDATE: 'Tentativa de alteração de campo restrito',
  BATCH_PASSWORD_RESET: 'Reset de senha em lote',
  SPECIFIC_PASSWORD_RESET: 'Reset de senha específica',
  DIAGNOSE_AUTH: 'Diagnóstico de autenticação',
  SYNC_AUTH_EMAIL: 'Sincronização de e-mail Auth',
  UPDATE_PASSWORD: 'Atualização de senha',
  VIEW_STUDENT_ACADEMIC_DATA: 'Visualizar dados acadêmicos',
};

export const tableMappings: Record<string, string> = {
  profiles: 'Usuários',
  classes: 'Turmas',
  subjects: 'Disciplinas',
  attendance: 'Frequência',
  grades: 'Notas',
  communications: 'Comunicações',
  class_communications: 'Comunicação de Turma',
  declarations: 'Declarações',
  evasions: 'Evasões',
  equipment: 'Equipamentos',
  equipment_allocations: 'Alocações de Equipamento',
  equipment_incidents: 'Incidentes de Equipamento',
  notifications: 'Notificações',
  selected_students: 'Alunos Selecionados',
  students_at_risk: 'Alunos em Risco',
  risk_interventions: 'Intervenções',
  audit_logs: 'Logs de Auditoria',
  system_settings: 'Configurações do Sistema',
  user_roles: 'Papéis de Usuário',
  auth: 'Autenticação',
};

export const getActionBadgeVariant = (
  action: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (action) {
    case 'CREATE':
    case 'INSERT':
    case 'RECORD_CREATED':
      return 'default';
    case 'UPDATE':
    case 'RECORD_UPDATED':
    case 'UPDATE_PASSWORD':
    case 'BATCH_PASSWORD_RESET':
    case 'SPECIFIC_PASSWORD_RESET':
    case 'ACCOUNT_UNBLOCKED':
      return 'secondary';
    case 'DELETE':
    case 'RECORD_DELETED':
    case 'ACCOUNT_AUTO_BLOCKED':
    case 'UNAUTHORIZED_ACCESS_ATTEMPT':
    case 'BLOCKED_ADMIN_FIELD_UPDATE':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const translateAction = (action: string): string =>
  actionMappings[action] || action;

export const translateTable = (tableName: string): string =>
  tableMappings[tableName] || tableName;
