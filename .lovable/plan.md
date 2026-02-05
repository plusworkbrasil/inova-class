

## Plano: Adicionar Linha Vertical do Dia Atual no Gráfico Gantt

### Objetivo

Adicionar uma linha vertical destacada que indica a posição do dia atual no gráfico Gantt, facilitando a visualização do progresso das disciplinas em relação à data de hoje.

---

### Arquivo a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar linha vertical do dia atual |

---

### Lógica de Posicionamento

A linha será posicionada usando a mesma lógica de cálculo percentual já existente:

```typescript
const todayPosition = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Verificar se hoje está dentro do range do timeline
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setDate(timelineEnd.getDate() + totalDays);
  
  if (today < timelineStart || today > timelineEnd) {
    return null; // Hoje está fora do range visível
  }
  
  const daysFromStart = differenceInDays(today, timelineStart);
  return (daysFromStart / totalDays) * 100;
}, [timelineStart, totalDays]);
```

---

### Componente da Linha do Dia Atual

Criar um componente interno para renderizar a linha:

```tsx
{/* Today marker line */}
{todayPosition !== null && (
  <div
    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
    style={{ left: `${todayPosition}%` }}
  >
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded whitespace-nowrap">
      Hoje
    </div>
  </div>
)}
```

---

### Locais de Inserção

| Linha | Mudança |
|-------|---------|
| ~232 | Adicionar cálculo `todayPosition` no useMemo existente ou criar novo useMemo após ele |
| ~471 | Inserir a linha vertical após as linhas de grade dos meses, dentro do container das barras |

---

### Estrutura Visual

```text
                    JAN    FEV    MAR    ABR    MAI    JUN
                                   |
  ─────────────────────────────────|────────────────────────
  React.js          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓|                        
  T02AB Tarde                      |                        
  João Silva                       |                        
  ─────────────────────────────────|────────────────────────
  Node.js                     ▓▓▓▓▓|▓▓▓▓▓                   
  T02AB Tarde                      |                        
  Maria Santos                     |                        
  ─────────────────────────────────|────────────────────────
                                   ↑
                               [Hoje]
```

---

### Detalhes de Implementação

#### 1. Calcular Posição do Dia Atual

Adicionar após o useMemo existente (~linha 232):

```typescript
// Calculate today's position on the timeline
const todayPosition = useMemo(() => {
  if (filteredSubjects.length === 0) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if today is within the visible timeline range
  const timelineEnd = new Date(timelineStart.getTime());
  timelineEnd.setDate(timelineEnd.getDate() + totalDays - 1);
  
  if (today < timelineStart || today > timelineEnd) {
    return null; // Today is outside visible range
  }
  
  const daysFromStart = differenceInDays(today, timelineStart);
  return (daysFromStart / totalDays) * 100;
}, [timelineStart, totalDays, filteredSubjects.length]);
```

#### 2. Renderizar Linha na Área das Barras

Inserir após as linhas de grade dos meses (~linha 471), dentro de cada linha:

```tsx
{/* Today marker line */}
{todayPosition !== null && (
  <div
    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
    style={{ left: `${todayPosition}%` }}
  />
)}
```

#### 3. Adicionar Indicador "Hoje" no Header

No header dos meses, adicionar um marcador visual:

```tsx
{/* Today marker in header */}
{todayPosition !== null && (
  <div
    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
    style={{ left: `${todayPosition}%` }}
  >
    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
      Hoje
    </div>
  </div>
)}
```

---

### Estilização da Linha

| Propriedade | Valor | Descrição |
|-------------|-------|-----------|
| Cor | `bg-red-500` | Vermelho vibrante para destaque |
| Largura | `w-0.5` (2px) | Fina mas visível |
| Z-index | `z-10` | Acima das barras do Gantt |
| Label | "Hoje" | Badge vermelho com texto branco |

---

### Comportamento Especial

| Situação | Comportamento |
|----------|---------------|
| Hoje dentro do range | Linha vermelha visível com label "Hoje" |
| Hoje fora do range | Linha não é renderizada |
| Filtro por ano passado | Linha não aparece (hoje fora do range) |

---

### Resultado Esperado

- Linha vertical vermelha atravessando todo o gráfico na posição do dia atual
- Label "Hoje" no topo da linha para identificação clara
- Linha visível na exportação PDF/Imagem
- Comportamento inteligente: só aparece se o dia atual estiver no range visível

