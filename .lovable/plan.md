

## Plano: Adicionar Botao Expandir/Colapsar por Turma no Grafico Gantt

### Objetivo

Adicionar funcionalidade interativa para expandir e colapsar os grupos de disciplinas por turma, permitindo que o usuario foque em turmas especificas e reduza a quantidade de informacao visual quando necessario.

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar estado e botoes de expandir/colapsar |

---

### Estrutura Visual

```text
+---------------------------+--------------------------------------------+
| Disciplina / Turma / Prof |  JAN    FEV    MAR    ABR    MAI    JUN   |
+===========================+============================================+
| [v] JOVEM TECH T02ABC - NOITE                    (6 disciplinas)       |
+---------------------------+--------------------------------------------+
|   | Banco de Dados        |  ████████                                  |
|   | React                 |       ████████                             |
|   | C#                    |            ████████                        |
|   | React Native          |                  ████████                  |
+===========================+============================================+
| [>] JOVEM TECH T02XYZ - MANHA (COLAPSADO)        (4 disciplinas)       |
+===========================+============================================+
| [v] OUTRA TURMA                                  (3 disciplinas)       |
+---------------------------+--------------------------------------------+
|   | Python                |  ████████                                  |
+---------------------------+--------------------------------------------+
```

---

### Mudancas Tecnicas

#### 1. Adicionar Estado para Controlar Grupos Expandidos

```typescript
// State to track expanded/collapsed groups
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

// Initialize all groups as expanded on first load
useEffect(() => {
  if (groupedSubjects.length > 0 && expandedGroups.size === 0) {
    setExpandedGroups(new Set(groupedSubjects.map(g => g.classId)));
  }
}, [groupedSubjects]);
```

#### 2. Funcao para Alternar Estado de Expansao

```typescript
const toggleGroup = (classId: string) => {
  setExpandedGroups(prev => {
    const newSet = new Set(prev);
    if (newSet.has(classId)) {
      newSet.delete(classId);
    } else {
      newSet.add(classId);
    }
    return newSet;
  });
};
```

#### 3. Botoes para Expandir/Colapsar Todos

Adicionar na barra de ferramentas junto aos botoes de exportacao:

```tsx
<div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setExpandedGroups(new Set(groupedSubjects.map(g => g.classId)))}
    disabled={expandedGroups.size === groupedSubjects.length}
  >
    <ChevronsDown className="h-4 w-4 mr-1" />
    Expandir Todos
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setExpandedGroups(new Set())}
    disabled={expandedGroups.size === 0}
  >
    <ChevronsUp className="h-4 w-4 mr-1" />
    Colapsar Todos
  </Button>
</div>
```

#### 4. Modificar Cabecalho do Grupo

Tornar o cabecalho clicavel e adicionar icone de chevron:

```tsx
{/* Class header row - clickable */}
<div 
  className="flex border-b-2 border-t-2 cursor-pointer hover:opacity-90 transition-opacity"
  style={{ borderColor: color }}
  onClick={() => toggleGroup(group.classId)}
>
  <div 
    className="w-64 flex-shrink-0 p-2 font-semibold text-sm flex items-center gap-2"
    style={{ backgroundColor: `${color}15` }}
  >
    {/* Chevron icon */}
    {expandedGroups.has(group.classId) ? (
      <ChevronDown className="w-4 h-4 flex-shrink-0" />
    ) : (
      <ChevronRight className="w-4 h-4 flex-shrink-0" />
    )}
    <div 
      className="w-3 h-3 rounded-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="break-words flex-1">{group.className}</span>
    <Badge variant="secondary" className="ml-auto text-[10px] flex-shrink-0">
      {group.subjects.length}
    </Badge>
  </div>
  <div 
    className="flex-1 relative"
    style={{ backgroundColor: `${color}08` }}
  >
    {/* Today marker in header */}
    {todayPosition !== null && (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: `${todayPosition}%` }}
      />
    )}
  </div>
</div>
```

#### 5. Renderizacao Condicional das Disciplinas

```tsx
{/* Subject rows within group - only show if expanded */}
{expandedGroups.has(group.classId) && group.subjects.map((subject, index) => {
  // ... existing row content ...
})}
```

---

### Imports Adicionais

```typescript
import { ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react';
```

---

### Comportamento

| Acao | Resultado |
|------|-----------|
| Clique no cabecalho da turma | Expande/colapsa apenas aquela turma |
| Botao "Expandir Todos" | Expande todas as turmas |
| Botao "Colapsar Todos" | Colapsa todas as turmas |
| Grupo colapsado | Mostra apenas cabecalho com nome da turma e contagem |
| Grupo expandido | Mostra cabecalho + todas as disciplinas |

---

### Consideracoes para Exportacao

Importante: Durante a exportacao (PDF/Imagem), o estado atual sera mantido. Se o usuario quiser exportar o grafico completo, deve expandir todos os grupos antes de exportar.

---

### Localizacao das Mudancas

| Linha | Mudanca |
|-------|---------|
| ~1 | Adicionar `useEffect` ao import |
| ~4 | Adicionar icones `ChevronDown, ChevronRight, ChevronsDown, ChevronsUp` |
| ~69 | Adicionar estado `expandedGroups` |
| ~70-76 | Adicionar `useEffect` para inicializar grupos expandidos |
| ~77-85 | Adicionar funcao `toggleGroup` |
| ~438 | Adicionar botoes "Expandir Todos" e "Colapsar Todos" |
| ~506-535 | Modificar cabecalho do grupo para ser clicavel com icone |
| ~537 | Adicionar condicao `expandedGroups.has(group.classId)` |

