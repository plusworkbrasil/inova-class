

## Organizar Menu do Coordinator em Categorias Colapsaveis

### Objetivo
Reorganizar o menu do Coordinator em grupos colapsaveis, seguindo o mesmo padrao do Admin e Tutor.

### Estrutura proposta

| Categoria | Itens |
|-----------|-------|
| Dashboard (item solto) | Dashboard (`/`) |
| Gestao de Aulas | Turmas, Frequencia, Disciplinas, Evasoes |
| Relatorios | Relatorios, Historico do Aluno, Alunos Faltosos |
| Comunicacao (item solto) | Comunicacao (`/communications`) |

### Mudancas Tecnicas

**Arquivo: `src/components/layout/Navigation.tsx`**

1. Criar o array `coordinatorMenuGroups` do tipo `MenuEntry[]`:

```typescript
const coordinatorMenuGroups: MenuEntry[] = [
  { type: 'item', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  {
    type: 'group',
    label: 'Gestão de Aulas',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Turmas', path: '/classes' },
      { icon: ClipboardCheck, label: 'Frequência', path: '/attendance' },
      { icon: BookOpen, label: 'Disciplinas', path: '/subjects' },
      { icon: UserX, label: 'Acompanhamento', path: '/evasions' },
    ],
  },
  {
    type: 'group',
    label: 'Relatórios',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Relatórios', path: '/reports' },
      { icon: History, label: 'Histórico do Aluno', path: '/student-history' },
      { icon: AlertTriangle, label: 'Alunos Faltosos', path: '/student-absences' },
    ],
  },
  { type: 'item', icon: Mail, label: 'Comunicação', path: '/communications' },
];
```

2. Atualizar a condicao de renderizacao no JSX para incluir `coordinator`:

```typescript
const useGroupedMenu = userRole === 'admin' || userRole === 'tutor' || userRole === 'coordinator';

// No nav:
{useGroupedMenu ? (
  (userRole === 'admin' ? adminMenuGroups : userRole === 'tutor' ? tutorMenuGroups : coordinatorMenuGroups).map(...)
) : (
  currentMenuItems.map(...)
)}
```

3. Atualizar a linha do `currentMenuItems` para excluir tambem o coordinator:

```typescript
const currentMenuItems = (userRole === 'admin' || userRole === 'tutor' || userRole === 'coordinator') ? [] : (menuItems[userRole as keyof typeof menuItems] || []);
```

4. Remover a entrada `coordinator` do objeto `menuItems` (flat list).

### O que NAO muda
- Nenhum outro role e afetado.
- Nenhuma rota ou pagina precisa ser alterada.
- O comportamento de `defaultOpen` baseado na rota ativa ja funciona e sera reaproveitado.

