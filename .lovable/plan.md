## Objetivo

1. Quando o aluno **enviar** uma justificativa de falta, exibir notificação no sininho dos responsáveis pela validação (admin, coordinator, tutor, secretary).
2. Quando o admin/coordinator/secretary **aprovar ou rejeitar**, exibir notificação no sininho do **aluno** correspondente, em tempo real.

## Situação atual

- Aluno envia justificativa em `Declarations.tsx` → chama edge function `notify-justification`, que hoje só notifica `admin`, `coordinator`, `tutor` (faltam **secretary**).
- O sininho (`useNotifications.ts`) carrega notificações para `admin`, `coordinator`, `tutor` e `student` (falta **secretary**).
- Ao aprovar/rejeitar em `AbsenceJustifications.tsx`, já é feito `notifications.insert` para `student_id` (in-app) + e-mail. Como o hook do aluno já escuta realtime no `user_id`, a notificação **deve** chegar ao sininho dele — vamos validar e ajustar pequenos detalhes.

## Mudanças propostas

### 1. Edge function `supabase/functions/notify-justification/index.ts`
- Incluir `secretary` na lista de papéis notificados (`["admin","coordinator","tutor","secretary"]`).

### 2. Hook `src/hooks/useNotifications.ts`
- Adicionar `secretary` aos papéis-alvo do sininho (lista + realtime).

### 3. Página `src/pages/AbsenceJustifications.tsx` (notificação ao aluno)
- Manter a inserção em `notifications` para o `student_id` (já existe).
- Garantir `type` consistente: usar `justification_approved` / `justification_rejected` (em vez de `success`/`warning`) para facilitar futuros filtros e manter o título "Justificativa aprovada" / "Justificativa rejeitada".
- Garantir `reference_id = declaration.id` e `reference_type = 'declaration'` (já presente).
- Não depende de RLS extra: a policy `Service role can insert notifications` permite `INSERT` para todos, e o aluno consegue ler suas próprias via `Users can view their own notifications`.

### 4. Página `src/pages/AbsenceJustifications.tsx` (limpar badge)
- Ao abrir a página, marcar como lidas as notificações `type = 'justification_pending'` do usuário atual (zera o badge de quem entrou para validar).

### 5. Sem mudanças
- Sem alterações em RLS, schema, fluxo do aluno ou e-mails existentes.

## Resultado esperado

- **Sininho dos validadores** (admin/coordinator/tutor/secretary): toca em tempo real assim que o aluno envia a justificativa, com "Nova Justificativa de Falta".
- **Sininho do aluno**: toca em tempo real ao ser aprovada/rejeitada, com "Justificativa aprovada" ou "Justificativa rejeitada" (incluindo motivo, se houver).
- Badge dos validadores zera ao entrar na tela `/validar-justificativas`.