## Objetivo

Transformar a aba "Logs de Auditoria" em um histórico **completo e em tempo real** de todas as ações relevantes do sistema, mostrando claramente **quem fez o quê, quando, em qual recurso e quais campos foram alterados** (INSERT / UPDATE / DELETE / LOGIN / LOGOUT).

---

## 1. Banco de dados — captura automática (migration)

### 1.1 Função genérica de auditoria
Criar `public.audit_table_changes()` (SECURITY DEFINER, trigger function) que, para cada operação:

- Identifica o usuário via `auth.uid()` (fallback para `system` quando nulo, ex.: triggers internos).
- Define a `action`:
  - INSERT → `RECORD_CREATED`
  - UPDATE → `RECORD_UPDATED`
  - DELETE → `RECORD_DELETED`
- Calcula `accessed_fields`:
  - INSERT/DELETE: lista de colunas não nulas (resumo)
  - UPDATE: apenas colunas onde `OLD.x IS DISTINCT FROM NEW.x` (lista de campos alterados — confirmado pelo usuário)
- Insere em `public.audit_logs` com `table_name = TG_TABLE_NAME` e `record_id = NEW.id` (ou `OLD.id` em DELETE).
- Ignora UPDATEs que não mudaram nenhuma coluna relevante (evita ruído de `updated_at`).

### 1.2 Triggers (AFTER INSERT/UPDATE/DELETE) nas tabelas:
`profiles`, `classes`, `subjects`, `attendance`, `grades`, `declarations`, `evasions`, `equipment`, `equipment_allocations`, `equipment_incidents`, `communications`, `class_communications`, `notifications`, `selected_students`, `students_at_risk`, `risk_interventions`, `system_settings`, `user_roles`.

### 1.3 Realtime
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;`
- `ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;`

### 1.4 Índices
- `idx_audit_logs_created_at DESC`
- `idx_audit_logs_user_id`
- `idx_audit_logs_table_name`
- `idx_audit_logs_action`

### 1.5 Política RLS
A política existente "Admins can view audit logs" já cobre leitura — manter. Insert continua aberto via "System can insert audit logs".

---

## 2. Frontend — `useAuditLogs` (refatoração)

- Adicionar **subscription Realtime** em `audit_logs`: ao receber `INSERT`, prepend no estado e atualizar `totalCount` (sem refetch completo).
- Implementar paginação real (page/pageSize já existem).
- Adicionar filtros server-side: usuário (busca por nome/email via join), ação, tabela, intervalo de datas.
- Resolver `user_name`, `user_email`, `user_role` em batch (já feito) — manter, mas cachear nomes para os novos eventos chegando via realtime.
- Registrar **LOGIN** após `signInWithPassword` bem-sucedido e **LOGOUT** antes de `signOut` em `useSupabaseAuth`, gravando direto em `audit_logs` (`action='LOGIN'|'LOGOUT'`, `table_name='auth'`, `record_id=user.id`).

---

## 3. Frontend — UI da aba "Logs de Auditoria" (`Settings.tsx`)

Reformular o painel para ficar **complexo e informativo**:

- **Indicador "ao vivo"** (ponto verde pulsando) quando a subscription está ativa.
- **Filtros** em linha: busca de usuário, ação (RECORD_CREATED / RECORD_UPDATED / RECORD_DELETED / LOGIN / LOGOUT / VIEW_*), tabela, intervalo de datas (últimas 24h / 7d / 30d / personalizado).
- **Resumo no topo**: cards com totais por ação no período selecionado (Criados, Atualizados, Deletados, Logins).
- **Tabela** colunas: Data/Hora · Usuário (nome + papel + email) · Ação (badge colorido) · Recurso (tabela traduzida + record_id curto) · Campos afetados (chips, com "+N" colapsado) · IP.
- **Linha expansível** ao clicar: mostra todos os campos alterados, user_agent completo e ID completo do registro.
- **Paginação** com seletor de tamanho (25/50/100) e botão "Atualizar agora".
- **Exportar CSV** do resultado filtrado (cliente).

---

## 4. Mapeamentos (`auditMappings.ts`)

Adicionar:

- Ações: `RECORD_CREATED` → "Registro criado", `RECORD_UPDATED` → "Registro atualizado", `RECORD_DELETED` → "Registro deletado", `LOGIN` → "Login", `LOGOUT` → "Logout".
- Cores semânticas: criado = `default` (verde), atualizado = `secondary` (azul), deletado = `destructive` (vermelho), login/logout = `outline`.
- Tabelas: incluir todas as novas (`equipment_allocations`, `equipment_incidents`, `class_communications`, `notifications`, `selected_students`, `students_at_risk`, `risk_interventions`, `user_roles`, `auth`).

---

## 5. Considerações técnicas

- A função `audit_table_changes` precisa ser SECURITY DEFINER e usar `SET search_path = public` para passar o linter.
- Para evitar inflar a tabela com auto-updates do trigger `update_updated_at_column`, a função compara colunas excluindo `updated_at` no cálculo de "campos alterados".
- Realtime exige que o usuário esteja autenticado como admin (RLS já filtra automaticamente).
- Sem mudanças em tabelas `auth.*` ou `storage.*` (proibido).

---

## Arquivos previstos

- **Nova migration**: triggers + função genérica + realtime + índices.
- `src/hooks/useAuditLogs.ts` — adicionar realtime, filtros server-side, dedup de profiles.
- `src/lib/auditMappings.ts` — novas ações/tabelas/cores.
- `src/pages/Settings.tsx` — substituir bloco da aba "logs" pelo novo painel.
- `src/hooks/useSupabaseAuth.ts` — gravar LOGIN/LOGOUT em `audit_logs`.