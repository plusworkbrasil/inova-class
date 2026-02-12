

## Paginacao e Filtro por Periodo no Registro de Frequencia

### Objetivo
Adicionar paginacao a tabela de registros de frequencia e substituir o filtro de data unica por um filtro de periodo (data inicio e data fim).

### 1. Filtro por Periodo (substituir filtro de data unica)

O filtro atual permite selecionar apenas uma data. Sera substituido por dois campos: **Data Inicio** e **Data Fim**.

**Mudancas de estado:**
- Remover `selectedDate` (Date | undefined)
- Adicionar `startDate` (Date | undefined) e `endDate` (Date | undefined)

**Mudanca no layout dos filtros:**
- O grid atual tem 5 colunas: busca (2 cols), turma, disciplina, data
- Novo grid tera 6 colunas: busca (2 cols), turma, disciplina, data inicio, data fim

**Mudanca na logica de filtragem** (em `getFilteredData` e `getFilteredGroupedRecords`):
```
if (startDate) {
  filtered = filtered.filter(record => record.date >= format(startDate, 'yyyy-MM-dd'));
}
if (endDate) {
  filtered = filtered.filter(record => record.date <= format(endDate, 'yyyy-MM-dd'));
}
```

**Atualizar `clearFilters`** para limpar ambas as datas.

### 2. Paginacao

**Constante e estado:**
```typescript
const ITEMS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(1);
```

**Reset de pagina ao mudar filtros:**
```typescript
useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedClass, selectedSubject, startDate, endDate]);
```

**Fatiar dados paginados:**
```typescript
const totalItems = userRole === 'student' ? filteredRecords.length : groupedRecords.length;
const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const paginatedData = (userRole === 'student' ? filteredRecords : groupedRecords)
  .slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

**Componente de paginacao** abaixo de cada tabela usando os componentes Pagination do shadcn:
- Botoes Anterior / Proximo
- Numeros de pagina com ellipsis
- Texto "Mostrando X-Y de Z registros"
- Botoes desabilitados na primeira/ultima pagina

### Detalhes Tecnicos

**Arquivo unico alterado: `src/pages/Attendance.tsx`**

1. Adicionar imports: `Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis`
2. Trocar `selectedDate` por `startDate` e `endDate`
3. Adicionar `currentPage` e `ITEMS_PER_PAGE`
4. Atualizar `getFilteredData()` e `getFilteredGroupedRecords()` para filtrar por range de datas
5. Adicionar logica de paginacao (slice dos arrays)
6. Substituir os dois Popovers de data unica por dois Popovers (Data Inicio / Data Fim)
7. Renderizar componente de paginacao abaixo das tabelas (ambas as views: student e grouped)
8. Atualizar `clearFilters` para limpar `startDate`, `endDate` e resetar `currentPage`

### O que NAO muda
- Hook `useSupabaseAttendance` continua inalterado
- Dialogos, formularios e estatisticas nao sao afetados
- Nenhuma outra pagina e alterada

