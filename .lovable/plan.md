

## Reorganizar Menu Admin em Categorias Colapsaveis

### Estrutura Proposta (ajustada)

Itens que existem hoje no menu admin mas nao estavam na proposta: **Usuarios** e **Comunicacao**. Foram incluidos abaixo em "Gestao Administrativa".

O item "Alunos" sera mapeado para `/users` (mesma pagina de Usuarios, possivelmente com filtro futuro).

```text
> Dashboard                    (/)

v Gestao de Aulas
  - Turmas                     (/classes)
  - Usuarios                   (/users)
  - Disciplinas                (/subjects)
  - Frequencia                 (/attendance)
  - Evasoes                    (/evasions)
  - Notas por Disciplina       (/subject-grades)

v Relatorios
  - Relatorio Geral            (/reports)
  - Historico do Aluno         (/student-history)
  - Alunos Faltosos            (/student-absences)

v Gestao Administrativa
  - Equipamentos               (/equipment)
  - Comunicacao                (/communications)

> Configuracoes                (/settings)
```

Dashboard e Configuracoes ficam como itens avulsos (sem grupo). Os 3 grupos intermediarios sao colapsaveis usando o componente Collapsible do Radix (ja instalado no projeto).

### Mudancas Tecnicas

**Arquivo: `src/components/layout/Navigation.tsx`**

1. **Adicionar imports**: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `@/components/ui/collapsible`, e `ChevronDown` do lucide-react.

2. **Reestruturar `menuItems.admin`** de array plano para estrutura com grupos:

```typescript
const adminMenuGroups = [
  {
    // Item avulso (sem grupo)
    type: 'item' as const,
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/',
  },
  {
    type: 'group' as const,
    label: 'Gestão de Aulas',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Turmas', path: '/classes' },
      { icon: Users, label: 'Usuários', path: '/users' },
      { icon: BookOpen, label: 'Disciplinas', path: '/subjects' },
      { icon: ClipboardCheck, label: 'Frequência', path: '/attendance' },
      { icon: UserX, label: 'Evasões', path: '/evasions' },
      { icon: BookOpen, label: 'Notas por Disciplina', path: '/subject-grades' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Relatórios',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Relatório Geral', path: '/reports' },
      { icon: History, label: 'Histórico do Aluno', path: '/student-history' },
      { icon: AlertTriangle, label: 'Alunos Faltosos', path: '/student-absences' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Gestão Administrativa',
    icon: Monitor,
    items: [
      { icon: Monitor, label: 'Equipamentos', path: '/equipment' },
      { icon: Mail, label: 'Comunicação', path: '/communications' },
    ],
  },
  {
    type: 'item' as const,
    icon: Settings,
    label: 'Configurações',
    path: '/settings',
  },
];
```

3. **Renderizacao no JSX**: Para o role `admin`, renderizar `adminMenuGroups` em vez do array plano. Cada grupo usa `Collapsible`:

```typescript
// Para cada grupo colapsavel:
<Collapsible defaultOpen={grupoContemRotaAtiva}>
  <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
    <span className="flex items-center gap-2">
      <GroupIcon className="h-4 w-4" />
      {group.label}
    </span>
    <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
  </CollapsibleTrigger>
  <CollapsibleContent className="pl-4 space-y-1">
    {group.items.map(item => (
      <Button variant={isActive ? "default" : "ghost"} ...>
        <item.icon /> {item.label}
      </Button>
    ))}
  </CollapsibleContent>
</Collapsible>
```

- Grupos que contem a rota ativa iniciam abertos (`defaultOpen={true}`)
- Itens avulsos (Dashboard, Configuracoes) renderizam como botoes simples, sem Collapsible

4. **Demais roles** (coordinator, secretary, tutor, teacher, instructor, student) continuam com o array plano e renderizacao atual -- sem alteracao.

### Componentes Utilizados

- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` -- ja existem em `src/components/ui/collapsible.tsx`
- `ChevronDown` -- ja disponivel no lucide-react

### Resultado Visual

O menu lateral do admin tera grupos colapsaveis com seta indicativa. Clicar no titulo do grupo expande/recolhe os sub-itens. O grupo que contem a pagina atual inicia expandido automaticamente.

