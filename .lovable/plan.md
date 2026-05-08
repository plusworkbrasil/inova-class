## Objetivo

Adicionar a opção "Bloqueado por tentativa" no filtro de status da página "Gerenciamento de Usuários", permitindo isolar contas que foram automaticamente bloqueadas pelo sistema após tentativas não autorizadas (status `blocked`, gerado pela função `record_unauthorized_access_attempt`).

## Mudanças

### `src/pages/Users.tsx`

1. **Filtro de status** — adicionar `<SelectItem value="blocked">Bloqueado por tentativa</SelectItem>` no `<Select>` de status (após "Evadido").
2. **Badge** — em `getStatusBadge`, tratar `case 'blocked'` retornando `<Badge variant="destructive">Bloqueado</Badge>` para destacar visualmente na lista.
3. **Resumo de filtros ativos** — atualizar o mapeamento de label do `selectedStatus` para incluir `blocked → "Bloqueado por tentativa"`.

## Fora do escopo
- Sem alterações no schema, RLS, hook `useUsers`, ou na lógica de bloqueio automático (já gravada no DB via `record_unauthorized_access_attempt`).
- Nenhuma mudança no fluxo de desbloqueio existente.
