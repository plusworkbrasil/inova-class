
## Plano: Adicionar Filtro por Status da Disciplina no Gráfico Gantt

### Objetivo

Adicionar um seletor de status ao gráfico Gantt que permite filtrar disciplinas por:
- **Em andamento**: Disciplinas cujo período inclui a data atual
- **Finalizada**: Disciplinas com data de término anterior à data atual
- **Futura**: Disciplinas com data de início posterior à data atual

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar estado, logica e UI do filtro por status |

---

### Definicao de Status

```typescript
type SubjectStatus = 'all' | 'ongoing' | 'finished' | 'future';

const getSubjectStatus = (startDate: string, endDate: string): 'ongoing' | 'finished' | 'future' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (end < today) return 'finished';      // Terminou antes de hoje
  if (start > today) return 'future';      // Comeca depois de hoje
  return 'ongoing';                         // Hoje esta entre inicio e fim
};
```

---

### Mudancas no Componente

#### 1. Adicionar Estado para Filtro de Status

```typescript
const [selectedStatus, setSelectedStatus] = useState<string>('all');
```

#### 2. Adicionar Funcao de Calculo de Status

```typescript
const getSubjectStatus = (startDate: string, endDate: string): 'ongoing' | 'finished' | 'future' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (end < today) return 'finished';
  if (start > today) return 'future';
  return 'ongoing';
};
```

#### 3. Atualizar Cadeia de Filtros

Adicionar filtro por status apos o filtro por professor:

```typescript
// Filtrar por professor
const filteredByTeacher = useMemo(() => {
  if (selectedTeacher === 'all') return filteredByClass;
  return filteredByClass.filter(s => s.teacher_id === selectedTeacher);
}, [filteredByClass, selectedTeacher]);

// Filtrar por status (NOVO)
const filteredSubjects = useMemo(() => {
  if (selectedStatus === 'all') return filteredByTeacher;
  return filteredByTeacher.filter(s => getSubjectStatus(s.start_date, s.end_date) === selectedStatus);
}, [filteredByTeacher, selectedStatus]);
```

#### 4. Adicionar UI do Filtro de Status

Posicao: Apos o filtro de Professor

```tsx
{/* Filtro por Status */}
<div className="flex items-center gap-2">
  <span className="text-sm font-medium text-muted-foreground">Status:</span>
  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Selecionar" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="ongoing">Em andamento</SelectItem>
      <SelectItem value="finished">Finalizadas</SelectItem>
      <SelectItem value="future">Futuras</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### 5. Atualizar Badge de Contador

```tsx
{(selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all' || selectedStatus !== 'all') && (
  <Badge variant="secondary">
    {filteredSubjects.length} disciplina(s)
  </Badge>
)}
```

#### 6. Atualizar Mensagem de Estado Vazio

```tsx
<p>
  Nenhuma disciplina encontrada
  {selectedYear !== 'all' || selectedClass !== 'all' || selectedTeacher !== 'all' || selectedStatus !== 'all'
    ? ' para os filtros selecionados' 
    : ' com datas definidas'}.
</p>
```

---

### Fluxo de Filtros em Cascata Atualizado

```text
Todas as Disciplinas
        |
        v
Filtro por Ano (selectedYear)
        |
        v
Filtro por Turma (selectedClass)
        |
        v
Filtro por Professor (selectedTeacher)
        |
        v
Filtro por Status (selectedStatus) <-- NOVO
        |
        v
Grafico Gantt Renderizado
```

---

### Interface Visual Esperada

```text
+-------------------------------------------------------------------------------------------+
|  Cronograma de Disciplinas                                                                |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  Ano: [v 2025]  Turma: [v Todas]  Professor: [v Todos]  Status: [v Em andamento]         |
|                                                                                           |
|  * 3 disciplinas                                               [PDF] [Imagem]             |
|                                                                                           |
|                    JAN    FEV    MAR    ABR    MAI    JUN                                 |
|  ---------------------------------------------------------------------------------        |
|  React.js                 ############                                                    |
|  T02AB Tarde                                                                              |
|  Joao Silva                                                                               |
|  ---------------------------------------------------------------------------------        |
|  Node.js                        ############                                              |
|  T02AB Tarde                                                                              |
|  Maria Santos                                                                             |
|  ---------------------------------------------------------------------------------        |
+-------------------------------------------------------------------------------------------+
```

---

### Comportamento dos Status

| Status | Condicao | Exemplo (hoje = 01/03/2025) |
|--------|----------|----------------------------|
| **Em andamento** | `start <= hoje <= end` | 15/02/2025 - 15/04/2025 |
| **Finalizada** | `end < hoje` | 01/01/2025 - 28/02/2025 |
| **Futura** | `start > hoje` | 01/04/2025 - 30/06/2025 |

---

### Combinacoes de Filtros

| Ano | Turma | Professor | Status | Resultado |
|-----|-------|-----------|--------|-----------|
| Todos | Todas | Todos | Todos | Todas as disciplinas |
| 2025 | Todas | Todos | Em andamento | Disciplinas de 2025 em execucao |
| Todos | T02AB | Joao | Finalizadas | Disciplinas finalizadas do Joao na T02AB |
| Todos | Todas | Todos | Futuras | Todas as disciplinas que ainda vao comecar |

---

### Locais de Mudanca

| Linha | Mudanca |
|-------|---------|
| ~68 | Adicionar estado `selectedStatus` |
| ~108 | Adicionar funcao `getSubjectStatus` |
| ~127-130 | Renomear `filteredSubjects` para `filteredByTeacher` |
| ~132 | Adicionar novo `filteredSubjects` com filtro de status |
| ~294-296 | Atualizar condicao da mensagem vazia (empty state) |
| ~347 | Adicionar Select de Status na UI |
| ~348 | Atualizar condicao do Badge contador |

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Filtros: Ano, Turma, Professor | Filtros: Ano, Turma, Professor, Status |
| Sem nocao de progresso temporal | Facil identificar disciplinas atuais, passadas e futuras |
| Todas disciplinas misturadas | Visao focada por status de execucao |
