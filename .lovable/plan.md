

## Plano: Adicionar Filtro por Ano no Gráfico Gantt

### Objetivo

Adicionar um seletor de ano acima do gráfico Gantt para permitir que o usuário visualize apenas as disciplinas de um ano letivo específico, facilitando a análise de períodos passados ou futuros.

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar filtro de ano e props para receber ano selecionado |

---

### Implementação

#### 1. Adicionar Estado e Filtro de Ano

**Localização:** Dentro do componente `SubjectsGanttChart`

**Mudanças:**
- Adicionar estado `selectedYear` para armazenar o ano selecionado
- Extrair anos disponíveis das disciplinas (baseado nas datas)
- Adicionar opção "Todos" para mostrar todas as disciplinas
- Filtrar disciplinas antes de calcular o gráfico

```typescript
// Novos estados e imports
import { useState } from 'react';
import { getYear } from 'date-fns';

// Dentro do componente:
const [selectedYear, setSelectedYear] = useState<string>('all');

// Extrair anos únicos das disciplinas
const availableYears = useMemo(() => {
  const years = new Set<number>();
  subjects.forEach(s => {
    years.add(getYear(parseISO(s.start_date)));
    years.add(getYear(parseISO(s.end_date)));
  });
  return Array.from(years).sort((a, b) => b - a); // Ordenar decrescente (mais recente primeiro)
}, [subjects]);

// Filtrar disciplinas pelo ano selecionado
const filteredSubjects = useMemo(() => {
  if (selectedYear === 'all') return subjects;
  const year = parseInt(selectedYear);
  return subjects.filter(s => {
    const startYear = getYear(parseISO(s.start_date));
    const endYear = getYear(parseISO(s.end_date));
    return startYear === year || endYear === year;
  });
}, [subjects, selectedYear]);
```

#### 2. Interface do Filtro

**Posição:** Acima do header de meses do gráfico

```tsx
{/* Filtro por Ano */}
<div className="flex items-center gap-3 mb-4">
  <span className="text-sm font-medium text-muted-foreground">
    Filtrar por ano:
  </span>
  <Select value={selectedYear} onValueChange={setSelectedYear}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="Selecionar ano" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos os anos</SelectItem>
      {availableYears.map(year => (
        <SelectItem key={year} value={year.toString()}>
          {year}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {selectedYear !== 'all' && (
    <Badge variant="secondary">
      {filteredSubjects.length} disciplina(s)
    </Badge>
  )}
</div>
```

---

### Fluxo de Dados Atualizado

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         useAllSubjectsTimeline                           │
│  (busca TODAS as disciplinas com datas)                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SubjectsGanttChart                               │
│                                                                          │
│  1. Extrair anos únicos das disciplinas                                  │
│  2. Mostrar seletor de ano                                               │
│  3. Filtrar disciplinas pelo ano selecionado                             │
│  4. Calcular período total (apenas das disciplinas filtradas)            │
│  5. Renderizar gráfico com disciplinas filtradas                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Comportamento do Filtro

| Seleção | Comportamento |
|---------|---------------|
| **Todos os anos** | Mostra todas as disciplinas (comportamento atual) |
| **Ano específico (ex: 2025)** | Mostra apenas disciplinas que têm início ou fim nesse ano |
| **Contador** | Badge mostra quantas disciplinas estão visíveis |

---

### Exemplo Visual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Cronograma de Disciplinas                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Filtrar por ano:  [▼ 2025      ]  ⬤ 12 disciplinas                        │
│                                                                             │
│                    JAN    FEV    MAR    ABR    MAI    JUN    JUL            │
│  ─────────────────────────────────────────────────────────────────          │
│  Comp. em Nuvens   ▓▓▓▓▓▓▓▓▓                                                │
│  T02ABC Noite      └──────────────┘                                         │
│                                                                             │
│  Projetos                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │
│  T02ABC Noite             └─────────────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

**Imports a adicionar:**
```typescript
import { useState } from 'react';
import { getYear } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

**Mudanças no cálculo do gráfico:**
- O `useMemo` que calcula meses, cores e posições agora usará `filteredSubjects` em vez de `subjects`
- Quando não há disciplinas filtradas, mostrar mensagem apropriada

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Todas as disciplinas sempre visíveis | Filtro por ano no topo do gráfico |
| Timeline pode ficar muito longa | Timeline ajustada ao período selecionado |
| Difícil focar em um período | Fácil visualizar apenas o ano desejado |

