

## Organizar Menu do Tutor em Categorias Colapsaveis

### Objetivo
Reorganizar o menu lateral do Tutor em grupos colapsaveis, seguindo o mesmo padrao ja implementado para o Admin.

### Estrutura proposta

| Categoria | Itens |
|-----------|-------|
| Dashboard (item solto) | Dashboard (`/`) |
| Gestao de Aulas | Turmas, Frequencia, Disciplinas, Notas por Disciplina, Evasoes |
| Relatorios | Relatorio Geral, Historico do Aluno, Alunos Faltosos, Alunos em Risco, Visao de Turmas |
| Acompanhamento | Declaracoes, Comunicacao |

### Mudancas Tecnicas

**Arquivo: `src/components/layout/Navigation.tsx`**

1. Criar um novo array `tutorMenuGroups` usando o mesmo tipo `AdminMenuEntry[]` (renomeado para `MenuEntry` para ficar generico):

```typescript
const tutorMenuGroups: MenuEntry[] = [
  { type: 'item', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    type: 'group',
    label: 'Gestão de Aulas',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Turmas', path: '/classes' },
      { icon: ClipboardCheck, label: 'Frequência', path: '/attendance' },
      { icon: BookOpen, label: 'Disciplinas', path: '/subjects' },
      { icon: BookOpen, label: 'Notas por Disciplina', path: '/subject-grades' },
      { icon: UserX, label: 'Evasões', path: '/evasions' },
    ],
  },
  {
    type: 'group',
    label: 'Relatórios',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Relatório Geral', path: '/reports' },
      { icon: History, label: 'Histórico do Aluno', path: '/student-history' },
      { icon: AlertTriangle, label: 'Alunos Faltosos', path: '/student-absences' },
      { icon: AlertTriangle, label: 'Alunos em Risco', path: '/students-at-risk' },
      { icon: GraduationCap, label: 'Visão de Turmas', path: '/class-timeline' },
    ],
  },
  {
    type: 'group',
    label: 'Acompanhamento',
    icon: Mail,
    items: [
      { icon: FileText, label: 'Declarações', path: '/declarations' },
      { icon: Mail, label: 'Comunicação', path: '/communications' },
    ],
  },
];
```

2. Renomear o tipo `AdminMenuEntry` para `MenuEntry` para refletir o uso compartilhado.

3. Atualizar a condicao de renderizacao no `<nav>` para tratar tambem o tutor com a logica de grupos colapsaveis:

```typescript
{(userRole === 'admin' || userRole === 'tutor') ? (
  (userRole === 'admin' ? adminMenuGroups : tutorMenuGroups).map(...)
) : (
  currentMenuItems.map(...)
)}
```

A logica de renderizacao dos grupos (Collapsible com defaultOpen baseado na rota ativa) ja existe e sera reutilizada sem alteracao.

4. Remover a entrada `tutor` do objeto `menuItems` (flat list), pois nao sera mais utilizada.

### O que NAO muda
- Nenhum outro role e afetado.
- Nenhuma rota ou pagina precisa ser alterada.
- O comportamento de `defaultOpen` baseado na rota ativa ja funciona e sera reaproveitado.

