## Objetivo

Unificar a tela de "Histórico de Declarações" (`/minhas-declaracoes`) dentro da página "Declarações" (`/declaracoes`), eliminando a entrada duplicada no menu do aluno e centralizando tudo em um único lugar.

## Mudanças

### 1. `src/pages/Declarations.tsx` (visão do aluno)
- Para `userRole === 'student'`, substituir o layout atual pelo conteúdo do `StudentDeclarationsHistory` (cards de estatísticas Total/Pendentes/Aprovadas/Rejeitadas, filtros por busca/status/tipo, tabela com paginação de 10 itens, dialog de detalhes com download de anexo).
- Manter o botão "Nova Solicitação" no cabeçalho, abrindo o `StudentDeclarationForm` já existente (fluxo de criação preservado, incluindo notificações ao admin/secretaria via `notify-justification`).
- Para admin/coordenador/tutor/instrutor, manter exatamente a tela atual de gerenciamento (sem alteração).

### 2. `src/components/layout/Navigation.tsx`
- Remover o item "Histórico de Declarações" (linha 244) do menu do aluno. O acesso passa a ser apenas via "Declarações".

### 3. `src/App.tsx`
- Manter a rota `/minhas-declaracoes` como redirecionamento para `/declaracoes` (compatibilidade com links antigos/notificações), ou removê-la. Proposta: redirecionar via `<Navigate to="/declaracoes" replace />`.
- Remover o import de `StudentDeclarationsHistory` se a rota for substituída por `Navigate`.

### 4. `src/pages/StudentDeclarationsHistory.tsx`
- Excluir o arquivo após a migração (toda a lógica vive agora no `Declarations.tsx`).

## Fora do escopo
- Sem mudanças em RLS, hooks, edge functions, schema ou no fluxo de notificações do sininho.
- Sem alterações na tela de gerenciamento usada por admin/coordenador/tutor/instrutor.
