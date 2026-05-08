## Objetivo

Fazer com que o aluno receba a notificação no sino (NotificationsPopover) **em tempo real** assim que a secretaria/admin alterar o status da sua declaração — sem precisar recarregar a página.

## Diagnóstico

1. O hook `src/hooks/useNotifications.ts` hoje só ativa o fetch e a subscription Realtime para `admin`, `coordinator` e `tutor`:
   ```ts
   const isTargetRole = profile?.role === 'admin' || ... || 'tutor';
   ```
   Para o aluno, ele retorna lista vazia e nunca abre canal Realtime — por isso novas notificações não aparecem.
2. A tabela `notifications` **não está incluída na publication `supabase_realtime`** (verificado via query). Sem isso, mesmo abrindo o canal, eventos de INSERT/UPDATE não chegariam ao cliente.
3. O componente `NotificationsPopover` já é renderizado no `Navigation` para todos os papéis e está pronto — basta o hook entregar dados.
4. As notificações para alunos já são gravadas em `public.notifications` pelo helper `notifyStudent` em `src/pages/Declarations.tsx` quando o status muda (pending/approved/rejected). Ou seja, a escrita já existe; falta apenas o tempo real do lado do aluno.

## Mudanças

### 1. Migração de banco (Realtime)
- Definir `REPLICA IDENTITY FULL` na tabela `public.notifications` para que o payload do Realtime contenha o registro completo.
- Adicionar `public.notifications` à publication `supabase_realtime` para emitir eventos de INSERT e UPDATE.

### 2. `src/hooks/useNotifications.ts`
- Incluir `student` em `isTargetRole` (renomear conceitualmente: passa a valer para qualquer papel autenticado que possa receber notificação).
- Manter o `subscribe` em `INSERT` (notificação nova) e adicionar também `UPDATE` (caso o status seja atualizado depois) — para `UPDATE`, substituir o item no estado pelo novo payload.
- Mostrar um toast discreto (`sonner`) quando chegar uma notificação nova enquanto o usuário está logado, com o título da notificação. Clique no toast leva para `/minhas-declaracoes` quando `reference_type === 'declaration'`.

### 3. `src/components/ui/notifications-popover.tsx`
- Para alunos, ao clicar numa notificação cujo `reference_type === 'declaration'`, navegar para `/minhas-declaracoes` (página do histórico do aluno) em vez de `/declarations` (que é a tela administrativa). Detectar pelo papel via `useAuth`.

## Fora do escopo
- Não altera o fluxo de e-mail (já implementado).
- Não altera o esquema da tabela `notifications`, apenas configurações de Realtime.
- Não mexe em RLS (a policy "Users can view their own notifications" já cobre o aluno).

## Detalhes técnicos (resumo para devs)

```sql
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

```ts
// useNotifications.ts
const isTargetRole = ['admin','coordinator','tutor','student'].includes(profile?.role ?? '');
// adicionar handler UPDATE no canal supabase
```
