

## Corrigir Filtro de "Alunos com Maior Numero de Faltas"

### Problema
O `.slice(0, 10)` na linha 363 de `useReportsData.ts` limita os dados a apenas 10 alunos antes do filtro por turma ser aplicado no Dashboard. Resultado: turmas sem alunos no top 10 global aparecem vazias ao filtrar.

### Mudancas

**1. `src/hooks/useReportsData.ts` (linha 363)**

Remover `.slice(0, 10)`:

```
// Antes:
.sort((a, b) => b.absences - a.absences)
.slice(0, 10);

// Depois:
.sort((a, b) => b.absences - a.absences);
```

**2. `src/components/dashboard/AdminDashboard.tsx`**

- Remover import de `useClasses` (linha 10) e sua chamada (linha 40)
- Adicionar `useMemo` para extrair turmas dos dados reais de faltas:

```typescript
const classesFromAbsences = useMemo(() => {
  const uniqueClasses = [...new Set(reportsData.topAbsentStudents.map(s => s.class))].filter(Boolean);
  return uniqueClasses.sort();
}, [reportsData.topAbsentStudents]);
```

- Atualizar os dois dropdowns de turma (linhas 92-96 e 401-405) para usar `classesFromAbsences`:

```typescript
{classesFromAbsences.map((className) => (
  <SelectItem key={className} value={className}>
    {className}
  </SelectItem>
))}
```

A paginacao existente (5 por pagina) continua controlando a exibicao visual.

