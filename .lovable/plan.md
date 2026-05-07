## Objetivo

No dashboard do Admin, exibir o widget **"Alunos em Risco Crítico"** retraído por padrão. O usuário clica no cabeçalho para expandir e ver a lista.

## Mudanças

**Arquivo:** `src/components/dashboard/AdminDashboard.tsx`

- Envolver o `CardContent` (linhas 207–272) com `Collapsible` do shadcn (`@/components/ui/collapsible`).
- Estado inicial: `open = false` (retraído).
- Tornar o `CardHeader` clicável como `CollapsibleTrigger`, adicionando ícone Chevron (Down/Up) que rotaciona conforme o estado.
- Manter o badge com a contagem total e o botão "Ver Todos" sempre visíveis no header (mesmo retraído), para que o admin veja rapidamente quantos alunos críticos existem sem precisar expandir.
- Impedir que o clique no botão "Ver Todos" propague para o trigger do Collapsible (`e.stopPropagation()`).

Nenhuma alteração de lógica, dados ou outros widgets.
