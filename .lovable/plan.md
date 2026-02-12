

## Adicionar Paginacao na Pagina de Evasoes

### Situacao Atual
A pagina `/evasions` **ja possui** filtro por periodo (Data Inicial / Data Final) implementado. Falta apenas adicionar a **paginacao** na tabela "Registros de Evasao".

### Mudancas Tecnicas

**Arquivo unico: `src/pages/Evasions.tsx`**

1. Adicionar imports dos componentes de paginacao:
```typescript
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { useEffect } from 'react';
```

2. Adicionar estado e constante:
```typescript
const ITEMS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(1);
```

3. Resetar pagina ao mudar filtros:
```typescript
useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedClass, selectedReason, startDate, endDate]);
```

4. Calcular dados paginados (apos `filteredEvasions`):
```typescript
const totalPages = Math.ceil(filteredEvasions.length / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const paginatedEvasions = filteredEvasions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

5. Na tabela, trocar `filteredEvasions.map(...)` por `paginatedEvasions.map(...)`

6. Abaixo da tabela (dentro do CardContent), adicionar componente de paginacao com:
   - Texto "Mostrando X-Y de Z registros"
   - Botoes Anterior / Proximo
   - Numeros de pagina com ellipsis
   - Botoes desabilitados na primeira/ultima pagina

### O que NAO muda
- Filtros por periodo, turma, motivo e busca permanecem inalterados
- Hook `useSupabaseEvasions` continua inalterado
- Exportacao (Excel/PDF) continua usando `filteredEvasions` completo (sem paginacao)
- Estatisticas e graficos nao sao afetados

