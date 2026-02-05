

## Plano: Adicionar Gráfico de Gantt de Disciplinas na Página Visão de Turmas

### Objetivo

Adicionar um quadro estilo "Microsoft Project" na página `/class-timeline` (Visão de Turmas), exibindo uma linha do tempo com barras coloridas representando cada disciplina de todas as turmas, organizadas por meses.

---

### Estrutura Visual do Gráfico

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CRONOGRAMA DE DISCIPLINAS                              │
├──────────────────────────┬──────────────────────────────────────────────────────────┤
│    DISCIPLINA - TURMA    │  SET   OUT   NOV   DEZ   JAN   FEV   MAR   ABR   MAI    │
├──────────────────────────┼──────────────────────────────────────────────────────────┤
│ Banco de Dados - T02AB   │ ████████████                                            │
│ React.js - T02AB         │            ██████████████                               │
│ C# - T02AB               │                         ████████████                    │
│ React Native - T02AB     │                                    ████████████         │
│ Comp. em Nuvens - T02ABC │                                             ███████████ │
│ Projetos - T02ABC        │ ████████████████████████████████████████████████████████│
└──────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **CRIAR** | Novo componente de gráfico Gantt |
| `src/hooks/useAllSubjectsTimeline.ts` | **CRIAR** | Hook para buscar todas as disciplinas com datas |
| `src/pages/ClassTimeline.tsx` | **MODIFICAR** | Adicionar o gráfico Gantt após as turmas críticas |

---

### 1. Novo Hook: `useAllSubjectsTimeline.ts`

```typescript
interface TimelineSubject {
  id: string;
  name: string;
  class_name: string;
  class_id: string;
  start_date: string;
  end_date: string;
  teacher_name: string | null;
}

// Busca todas as disciplinas com start_date e end_date
// Ordena por turma e depois por data de início
```

**Query:**
```sql
SELECT 
  s.id, s.name, s.start_date, s.end_date,
  c.name as class_name, c.id as class_id,
  p.name as teacher_name
FROM subjects s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN profiles p ON s.teacher_id = p.id
WHERE s.start_date IS NOT NULL AND s.end_date IS NOT NULL
ORDER BY c.name, s.start_date
```

---

### 2. Novo Componente: `SubjectsGanttChart.tsx`

**Características:**
- Eixo X: Meses (de setembro a maio, cobrindo o período escolar)
- Eixo Y: Lista de "Disciplina - Turma"
- Barras coloridas: Cada turma tem uma cor única
- Tooltip: Ao passar o mouse, mostra nome completo, datas e professor
- Responsivo: Scroll horizontal em telas pequenas

**Implementação técnica:**
- Usar CSS Grid para criar a grade de meses
- Calcular a posição e largura de cada barra baseado nas datas
- Cores por turma usando array de cores predefinidas
- Scroll horizontal para acomodar muitas disciplinas

```typescript
// Estrutura do componente
const SubjectsGanttChart = ({ subjects }: Props) => {
  // 1. Calcular range de meses (mínimo/máximo das datas)
  // 2. Gerar array de meses para o header
  // 3. Para cada disciplina:
  //    - Calcular posição inicial (% do total)
  //    - Calcular largura (% do total)
  //    - Renderizar barra colorida
  // 4. Agrupar por turma com cores distintas
}
```

**Paleta de cores por turma:**
```typescript
const CLASS_COLORS = [
  '#ef4444', // vermelho
  '#f97316', // laranja
  '#84cc16', // verde limão
  '#22c55e', // verde
  '#06b6d4', // ciano
  '#3b82f6', // azul
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#6366f1', // índigo
];
```

---

### 3. Modificação: `ClassTimeline.tsx`

**Localização:** Após o card de disciplinas críticas e antes do filtro por turma

```tsx
// Após linha ~165 (antes do Collapsible)
{/* Gráfico Gantt de Todas as Disciplinas */}
<Card className="mt-6">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      📊 Cronograma de Disciplinas
    </CardTitle>
    <CardDescription>
      Visualização tipo Gantt de todas as disciplinas por turma
    </CardDescription>
  </CardHeader>
  <CardContent>
    <SubjectsGanttChart />
  </CardContent>
</Card>
```

---

### Fluxo de Dados

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         useAllSubjectsTimeline                           │
│                                                                          │
│  1. Query subjects com joins em classes e profiles                       │
│  2. Filtrar apenas disciplinas com start_date e end_date                 │
│  3. Ordenar por turma e data de início                                   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SubjectsGanttChart                               │
│                                                                          │
│  1. Calcular período total (data mínima → data máxima)                   │
│  2. Gerar header com meses                                               │
│  3. Para cada disciplina:                                                │
│     - Calcular offset (left %) baseado na data de início                 │
│     - Calcular largura (%) baseado na duração                            │
│     - Atribuir cor baseada na turma                                      │
│  4. Renderizar grid com barras posicionadas                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Interface do Gráfico

| Elemento | Descrição |
|----------|-----------|
| **Header** | Meses do período (ex: Set, Out, Nov...) |
| **Linhas** | Uma linha por disciplina com rótulo "Nome - Turma" |
| **Barras** | Retângulos coloridos representando duração |
| **Tooltip** | Nome, turma, professor, datas (início/fim) |
| **Legenda** | Cores por turma |
| **Scroll** | Horizontal se necessário em mobile |

---

### Exemplo Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📊 Cronograma de Disciplinas                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                    SET    OUT    NOV    DEZ    JAN    FEV    MAR                │
│  ─────────────────────────────────────────────────────────────────              │
│  Banco de Dados    ▓▓▓▓▓▓▓▓▓                                                    │
│  T02AB Tarde       └──────────────┘                                             │
│                                                                                 │
│  React.js                 ▓▓▓▓▓▓▓▓▓▓▓                                           │
│  T02AB Tarde              └───────────────┘                                     │
│                                                                                 │
│  C#                              ▓▓▓▓▓▓▓▓▓▓                                     │
│  T02AB Tarde                     └──────────────┘                               │
│                                                                                 │
│  React.js                ▓▓▓▓▓▓▓                                                │
│  T02ABC Noite            └─────────┘                                            │
│                                                                                 │
│  Computação Nuvens                                      ▓▓▓▓▓▓▓▓▓▓              │
│  T02ABC Noite                                           └────────────┘          │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Legenda: ▓ T02AB Tarde  ▓ T02ABC Noite  ▓ T02C Noite  ▓ T02C Tarde            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Tecnologias Utilizadas

- **CSS Grid/Flexbox**: Para posicionamento das barras
- **date-fns**: Cálculo de diferenças entre datas e formatação de meses
- **Tailwind CSS**: Estilização responsiva
- **Componentes Shadcn**: Card, Tooltip, Badge

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Apenas lista de disciplinas urgentes | Lista de disciplinas urgentes + Gráfico Gantt visual |
| Sem visão temporal consolidada | Visão clara de todas as disciplinas por mês |
| Difícil identificar sobreposições | Fácil ver quando cada disciplina acontece |

