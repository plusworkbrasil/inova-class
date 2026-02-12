
## Notificacao de Justificativas e Atualizacao Automatica de Frequencia

### Objetivo
Quando um aluno enviar uma justificativa de falta, admin/coordenador/tutor recebem uma notificacao. Quando a justificativa for aprovada, o registro de frequencia correspondente e automaticamente atualizado para "falta justificada" com link para o documento enviado.

### 1. Nova tabela `notifications` no banco de dados

Criar tabela para armazenar notificacoes:

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  reference_id uuid,
  reference_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

**Politicas RLS:**
- Usuarios podem ver apenas suas proprias notificacoes
- Usuarios podem atualizar (marcar como lida) suas proprias notificacoes
- INSERT permitido via service role (edge function) ou pelo sistema

### 2. Edge Function `notify-justification`

Criar edge function chamada ao criar uma declaracao de justificativa. A funcao:
1. Recebe `declaration_id` e `student_name`
2. Busca todos os usuarios com role admin, coordinator, tutor na tabela `user_roles`
3. Insere uma notificacao para cada um deles com tipo `justification_pending`
4. Retorna sucesso

### 3. Logica de aprovacao - atualizar frequencia automaticamente

Quando admin/coordenador/tutor aprovar a justificativa em `Declarations.tsx` (`handleStatusChange` com status `approved`):

1. Buscar a declaracao para obter `student_id`, `absence_date` (extraida do campo `purpose` que contem a data), e `file_path`
2. Buscar o registro de attendance correspondente: mesmo `student_id` e `date` igual a `absence_date`
3. Se existir, atualizar o registro: `is_present = false`, `justification = 'Falta justificada - [tipo]'` com link/referencia ao `file_path`
4. Se nao existir, informar via toast que nao foi encontrado registro de falta para aquela data

### 4. Componente de notificacoes no layout (sino)

Adicionar um icone de sino no header/navigation para admin/coordinator/tutor que:
- Mostra badge com contagem de notificacoes nao lidas
- Ao clicar, abre dropdown/popover com lista de notificacoes
- Cada notificacao tem link para a pagina de Declaracoes
- Botao para marcar como lida

### 5. Exibir link do documento na tabela de Frequencia

Na pagina `/attendance`, quando a justificacao tiver `file_path` (vindo do campo `justification` do registro de attendance), exibir um icone de link/documento clicavel que abre/baixa o arquivo do bucket `declarations`.

---

### Detalhes Tecnicos

**Arquivos novos:**
- `supabase/functions/notify-justification/index.ts` - Edge function para criar notificacoes
- `src/hooks/useNotifications.ts` - Hook para buscar/atualizar notificacoes
- `src/components/ui/notifications-popover.tsx` - Componente do sino com popover

**Arquivos alterados:**
- `src/pages/Declarations.tsx` - Ao aprovar, atualizar attendance automaticamente
- `src/hooks/useSupabaseDeclarations.ts` - Adicionar chamada a edge function ao criar declaracao
- `src/components/layout/Navigation.tsx` - Adicionar sino de notificacoes no header
- `src/pages/Attendance.tsx` - Exibir link para documento de justificativa nas faltas justificadas

**Migracao SQL:**
1. Criar tabela `notifications`
2. Criar politicas RLS (SELECT e UPDATE para proprios registros, INSERT aberto para service role)

**Mudanca no `StudentDeclarationForm.tsx`:**
- Adicionar campo `delivery_date` (absence_date) na declaracao para facilitar o match com attendance

**Mudanca no `Declarations.tsx` - handleStatusChange:**
```typescript
if (newStatus === 'approved') {
  // Buscar declaracao completa
  // Buscar attendance do aluno na data da falta
  // Atualizar justification com tipo + file_path
}
```

**Mudanca no Attendance.tsx - coluna justificativa:**
- Se justification contem referencia a file_path, renderizar botao/link para baixar documento
