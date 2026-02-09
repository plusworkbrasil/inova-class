

## Plano: Corrigir Filtro de "Alunos com Maior Numero de Faltas" no Dashboard

### Problema Identificado

O filtro por turma na secao "Alunos com Maior Numero de Faltas" do Dashboard Admin nao funciona corretamente porque:

1. **Limite aplicado antes do filtro**: Em `useReportsData.ts` (linha 363), o resultado e cortado para apenas 10 alunos com `.slice(0, 10)` **antes** de o filtro por turma ser aplicado no `AdminDashboard.tsx`. Assim, ao selecionar uma turma que nao tem alunos entre os top 10, o resultado fica vazio - mesmo que existam alunos faltosos nessa turma.

2. **Dropdown mostra todas as turmas**: O `useClasses` retorna **todas** as turmas do sistema (inclusive as sem alunos ou sem disciplinas ativas), tornando o dropdown confuso com opcoes que nunca terao resultados.

### Mudancas Propostas

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useReportsData.ts` | MODIFICAR | Remover `.slice(0, 10)` para retornar todos alunos faltosos |
| `src/components/dashboard/AdminDashboard.tsx` | MODIFICAR | Usar classes filtradas a partir dos dados reais de faltas |

### Detalhes Tecnicos

#### 1. `src/hooks/useReportsData.ts` (linha 362-363)

Remover o `.slice(0, 10)` da funcao `processTopAbsentStudents`. Isso permite que o filtro por turma no Dashboard funcione sobre todos os alunos com faltas, e nao apenas sobre os 10 primeiros.

Antes:
```typescript
.sort((a, b) => b.absences - a.absences)
.slice(0, 10);
```

Depois:
```typescript
.sort((a, b) => b.absences - a.absences);
```

A paginacao existente no Dashboard (5 por pagina) ja limita o que e exibido visualmente.

#### 2. `src/components/dashboard/AdminDashboard.tsx` (linhas 394-407)

Trocar a fonte de turmas no dropdown: ao inves de usar `useClasses` (que traz todas as turmas), extrair as turmas diretamente dos dados de alunos faltosos. Isso garante que so aparecem turmas que realmente possuem alunos com faltas.

Antes:
```typescript
{!classesLoading && classes?.map((cls) => (
  <SelectItem key={cls.id} value={cls.name}>
    {cls.name}
  </SelectItem>
))}
```

Depois:
```typescript
// Extrair turmas unicas dos proprios dados de faltas
const classesFromAbsences = useMemo(() => {
  const uniqueClasses = [...new Set(reportsData.topAbsentStudents.map(s => s.class))];
  return uniqueClasses.sort();
}, [reportsData.topAbsentStudents]);
```

```typescript
{classesFromAbsences.map((className) => (
  <SelectItem key={className} value={className}>
    {className}
  </SelectItem>
))}
```

E remover o import/uso de `useClasses` se nao for usado em outro lugar no componente.

### Resultado Esperado

- Ao selecionar uma turma no filtro, a lista mostrara **todos os alunos faltosos daquela turma**, nao apenas os que estavam entre os top 10 gerais
- O dropdown so exibira turmas que realmente possuem alunos com faltas nos ultimos 7 dias
- A paginacao existente (5 por pagina) continua limitando a exibicao visual

