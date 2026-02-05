

## Plano: Adicionar Filtro por Professor no Gráfico Gantt

### Objetivo

Adicionar um seletor de professor acima do gráfico Gantt, permitindo visualizar apenas as disciplinas ministradas por um professor específico. O filtro funcionará em cascata com os filtros existentes (Ano > Turma > Professor).

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar estado, extração e filtro por professor |
| `src/hooks/useAllSubjectsTimeline.ts` | **MODIFICAR** | Adicionar `teacher_id` ao tipo e à query |

---

### 1. Modificação: `useAllSubjectsTimeline.ts`

Adicionar `teacher_id` para identificar unicamente cada professor:

```typescript
export interface TimelineSubject {
  id: string;
  name: string;
  class_name: string;
  class_id: string;
  start_date: string;
  end_date: string;
  teacher_name: string | null;
  teacher_id: string | null;  // NOVO
}

// Na query, adicionar teacher_id
const { data, error: queryError } = await supabase
  .from('subjects')
  .select(`
    id,
    name,
    start_date,
    end_date,
    class_id,
    teacher_id,  // NOVO
    classes!subjects_class_id_fkey (name),
    profiles!subjects_teacher_id_fkey (name)
  `)
  // ...

// No mapeamento:
teacher_id: item.teacher_id || null,
```

---

### 2. Modificação: `SubjectsGanttChart.tsx`

#### 2.1 Adicionar Estado para Filtro de Professor

```typescript
const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
```

#### 2.2 Extrair Professores Disponíveis

```typescript
const availableTeachers = useMemo(() => {
  if (subjects.length === 0) return [];
  const teachers = new Map<string, string>();
  subjects.forEach(s => {
    if (s.teacher_id && s.teacher_name) {
      teachers.set(s.teacher_id, s.teacher_name);
    }
  });
  return Array.from(teachers.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}, [subjects]);
```

#### 2.3 Adicionar Filtro em Cascata

Atualizar a cadeia de filtros: Ano → Turma → Professor

```typescript
// Filtrar por ano primeiro
const filteredByYear = useMemo(() => {
  if (selectedYear === 'all') return subjects;
  const year = parseInt(selectedYear);
  return subjects.filter(s => {
    const startYear = getYear(parseISO(s.start_date));
    const endYear = getYear(parseISO(s.end_date));
    return startYear === year || endYear === year;
  });
}, [subjects, selectedYear]);

// Depois filtrar por turma
const filteredByClass = useMemo(() => {
  if (selectedClass === 'all') return filteredByYear;
  return filteredByYear.filter(s => s.class_id === selectedClass);
}, [filteredByYear, selectedClass]);

// Por último, filtrar por professor (NOVO)
const filteredSubjects = useMemo(() => {
  if (selectedTeacher === 'all') return filteredByClass;
  return filteredByClass.filter(s => s.teacher_id === selectedTeacher);
}, [filteredByClass, selectedTeacher]);
```

#### 2.4 Adicionar UI do Filtro de Professor

Posição: Após o filtro de Turma

```tsx
{/* Filtro por Professor (NOVO) */}
<div className="flex items-center gap-2">
  <span className="text-sm font-medium text-muted-foreground">Professor:</span>
  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Selecionar" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      {availableTeachers.map(teacher => (
        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### 2.5 Atualizar Badge de Contador

```tsx
{(selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all') && (
  <Badge variant="secondary">
    {filteredSubjects.length} disciplina(s)
  </Badge>
)}
```

#### 2.6 Atualizar Mensagem de Estado Vazio

```tsx
<p>
  Nenhuma disciplina encontrada
  {selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all' 
    ? ' para os filtros selecionados' 
    : ' com datas definidas'}.
</p>
```

---

### Fluxo de Filtros em Cascata

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Todas as Disciplinas                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Filtro por Ano (selectedYear)                           │
│                 Mostra disciplinas do ano selecionado                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Filtro por Turma (selectedClass)                        │
│                 Mostra disciplinas da turma selecionada                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Filtro por Professor (selectedTeacher)                  │
│                 Mostra disciplinas do professor selecionado             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Gráfico Gantt Renderizado                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Interface Visual Esperada

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  📊 Cronograma de Disciplinas                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Ano: [▼ 2025]  Turma: [▼ Todas]  Professor: [▼ João Silva]  ⬤ 4    [PDF] [Imagem] │
│                                                                                     │
│                    SET    OUT    NOV    DEZ    JAN    FEV    MAR                    │
│  ─────────────────────────────────────────────────────────────────                  │
│  Banco de Dados    ▓▓▓▓▓▓▓▓▓                                                        │
│  T02AB Tarde       └──────────────┘                                                 │
│                                                                                     │
│  React.js                 ▓▓▓▓▓▓▓▓▓▓▓                                               │
│  T02AB Tarde              └───────────────┘                                         │
│                                                                                     │
│  C#                              ▓▓▓▓▓▓▓▓▓▓                                         │
│  T02ABC Noite                    └──────────────┘                                   │
│                                                                                     │
│  React Native                           ▓▓▓▓▓▓▓▓                                    │
│  T02C Tarde                             └────────────┘                              │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Comportamento dos Filtros Combinados

| Ano | Turma | Professor | Resultado |
|-----|-------|-----------|-----------|
| Todos | Todas | Todos | Todas as disciplinas |
| 2025 | Todas | Todos | Disciplinas de 2025 |
| 2025 | T02AB | Todos | Disciplinas de 2025 da turma T02AB |
| 2025 | T02AB | João Silva | Disciplinas de 2025, turma T02AB, professor João |
| Todos | Todas | Maria Santos | Todas as disciplinas da professora Maria |

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Filtros: Ano e Turma | Filtros: Ano, Turma e Professor |
| Difícil ver carga de um professor | Fácil visualizar disciplinas de um professor específico |
| Sem visão por docente | Visão clara da alocação por professor |

