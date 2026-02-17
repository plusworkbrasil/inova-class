

## Substituir cores hardcoded por design tokens do sistema

### Cores a substituir

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

#### 1. Celulas de presenca (renderCell, linhas 102-104)
- De: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`
- Para: `bg-secondary/10 text-secondary-foreground dark:bg-secondary/20 dark:text-secondary-foreground`
- De: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`
- Para: `bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive`

#### 2. Icones dos cards de resumo (linhas 225, 232, 239)
- `text-blue-500` (TrendingUp) -> `text-primary`
- `text-green-500` (CheckCircle) -> `text-secondary`
- `text-red-500` (XCircle) -> `text-destructive`

#### 3. Linhas de alunos com baixa frequencia (linhas 276, 282, 344)
- `bg-red-50 dark:bg-red-950/30` -> `bg-destructive/5 dark:bg-destructive/10`
- `border-red-200 dark:border-red-800` -> `border-destructive/30`

#### 4. Legenda (linhas 326, 332, 344)
- Mesmas substituicoes das celulas de presenca e destaque de baixa frequencia

### Resumo das substituicoes

| Cor hardcoded | Design token |
|---|---|
| `bg-green-100`, `dark:bg-green-900/30` | `bg-secondary/10`, `dark:bg-secondary/20` |
| `text-green-700`, `dark:text-green-300` | `text-secondary-foreground` |
| `bg-red-100`, `dark:bg-red-900/30` | `bg-destructive/10`, `dark:bg-destructive/20` |
| `text-red-700`, `dark:text-red-300` | `text-destructive` |
| `bg-red-50`, `dark:bg-red-950/30` | `bg-destructive/5`, `dark:bg-destructive/10` |
| `border-red-200`, `dark:border-red-800` | `border-destructive/30` |
| `text-blue-500` | `text-primary` |
| `text-green-500` | `text-secondary` |
| `text-red-500` | `text-destructive` |

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx` (10 substituicoes em 6 locais)
