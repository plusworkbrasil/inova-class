

## Plano: Reorganizar Layout do Gráfico Gantt - Turma na Linha, Disciplina/Professor na Barra

### Objetivo

Reestruturar o gráfico Gantt para:
- **Coluna lateral**: Mostrar apenas o nome da turma como identificador de linha
- **Barra do Gantt**: Exibir nome da disciplina e professor dentro da barra colorida

---

### Arquivo a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Reorganizar layout e agrupar por turma |

---

### Nova Estrutura Visual

```text
+-------------------------------------------------------------------------------------------+
|  Turma                        JAN    FEV    MAR    ABR    MAI    JUN                      |
|  ─────────────────────────────────────────────────────────────────────────────────────     |
|  T02AB Tarde                  [React.js - João Silva]                                      |
|                                      [Node.js - Maria Santos]                              |
|                                             [Python - Carlos Lima]                         |
|  ─────────────────────────────────────────────────────────────────────────────────────     |
|  T03ABC Noite                        [Banco de Dados - Ana Paula]                          |
|                               [JavaScript - Pedro Costa]                                   |
+-------------------------------------------------------------------------------------------+
```

---

### Mudanças Principais

#### 1. Agrupar Disciplinas por Turma

Criar estrutura agrupada para renderizar múltiplas barras na mesma linha de turma:

```typescript
// Novo: Agrupar disciplinas por turma
const subjectsByClass = useMemo(() => {
  const grouped = new Map<string, TimelineSubject[]>();
  filteredSubjects.forEach(subject => {
    const key = subject.class_id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(subject);
  });
  return Array.from(grouped.entries()).map(([classId, subjects]) => ({
    classId,
    className: subjects[0].class_name,
    subjects: subjects.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    ),
  }));
}, [filteredSubjects]);
```

#### 2. Modificar Componente GanttBar

Adicionar texto dentro da barra com nome da disciplina e professor:

```tsx
function GanttBar({ subject, color, leftPercent, widthPercent }: GanttBarProps) {
  // Calcular se a barra é larga o suficiente para mostrar texto
  const showText = widthPercent > 8; // Mostrar texto se barra > 8% da largura
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute h-7 rounded-sm cursor-pointer transition-all hover:opacity-80 hover:scale-y-110 flex items-center px-1 overflow-hidden"
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(widthPercent, 1)}%`,
              backgroundColor: color,
            }}
          >
            {showText && (
              <span className="text-[9px] text-white font-medium truncate drop-shadow-sm">
                {subject.name}
                {subject.teacher_name && ` - ${subject.teacher_name}`}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {/* Tooltip mantém informações completas */}
          <div className="space-y-1">
            <p className="font-semibold">{subject.name}</p>
            <p className="text-sm text-muted-foreground">Turma: {subject.class_name}</p>
            {subject.teacher_name && (
              <p className="text-sm text-muted-foreground">Professor: {subject.teacher_name}</p>
            )}
            <p className="text-xs">
              {format(parseISO(subject.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(parseISO(subject.end_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### 3. Atualizar Header da Coluna

```tsx
<div className="w-48 flex-shrink-0 p-2 font-semibold text-sm bg-muted">
  Turma
</div>
```

#### 4. Renderizar Linhas Agrupadas por Turma

Cada turma ocupa uma linha com múltiplas barras:

```tsx
{subjectsByClass.map((classGroup, index) => (
  <div
    key={classGroup.classId}
    className={`flex border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
  >
    {/* Coluna: Nome da Turma */}
    <div className="w-48 flex-shrink-0 p-2 text-xs font-medium flex items-center">
      {classGroup.className}
    </div>
    
    {/* Área das barras */}
    <div className="flex-1 relative" style={{ minHeight: `${classGroup.subjects.length * 32}px` }}>
      {/* Grid de meses */}
      {months.map((month, monthIndex) => (
        <div
          key={monthIndex}
          className="absolute h-full border-l border-border/50"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        />
      ))}
      
      {/* Barras de cada disciplina */}
      {classGroup.subjects.map((subject, subjectIndex) => {
        const { leftPercent, widthPercent } = calculatePosition(subject.start_date, subject.end_date);
        const color = classColorMap.get(subject.class_id) || CLASS_COLORS[0];
        
        return (
          <div
            key={subject.id}
            className="absolute"
            style={{ top: `${subjectIndex * 32 + 4}px` }}
          >
            <GanttBar
              subject={subject}
              color={color}
              leftPercent={leftPercent}
              widthPercent={widthPercent}
            />
          </div>
        );
      })}
    </div>
  </div>
))}
```

---

### Detalhes Técnicos

| Aspecto | Implementação |
|---------|---------------|
| **Altura da linha** | Dinâmica: `minHeight: subjects.length * 32px` |
| **Posição vertical** | Cada barra offset: `top: index * 32 + 4px` |
| **Texto na barra** | Visível se `widthPercent > 8%` |
| **Cor do texto** | Branco com `drop-shadow-sm` para contraste |
| **Tooltip** | Mantido para informações completas |

---

### Comparativo Visual

| Antes | Depois |
|-------|--------|
| 1 linha = 1 disciplina | 1 linha = 1 turma (múltiplas disciplinas) |
| Coluna: Disciplina/Turma/Professor | Coluna: apenas Turma |
| Barra: cor sólida | Barra: cor + texto (disciplina e professor) |
| Muitas linhas | Menos linhas, mais compacto |

---

### Comportamento para Barras Pequenas

- **Barras largas (>8%)**: Mostram texto "Disciplina - Professor"
- **Barras estreitas (<=8%)**: Apenas cor, texto completo no tooltip ao passar o mouse

---

### Locais de Mudança

| Linha | Mudança |
|-------|---------|
| 32-60 | Refatorar `GanttBar` para incluir texto |
| ~200 | Adicionar `subjectsByClass` agrupado |
| 415-416 | Atualizar header para "Turma" |
| 438-483 | Substituir renderização linha a linha por agrupamento |

