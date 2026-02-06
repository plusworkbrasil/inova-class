

## Plano: Animacao Suave e Campo de Pesquisa por Turma no Grafico Gantt

### Objetivo

Adicionar duas melhorias ao grafico Gantt:
1. **Animacao suave** ao expandir/colapsar os grupos de turmas para uma experiencia mais fluida
2. **Campo de pesquisa** para filtrar turmas pelo nome rapidamente

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar animacoes e campo de busca |

---

### Parte 1: Animacao Suave ao Expandir/Colapsar

#### Abordagem Tecnica

Usar CSS transitions com `max-height` e `opacity` para criar uma animacao suave. A abordagem mais robusta e usar `grid-template-rows` com transicao de `0fr` para `1fr`.

#### Modificacoes

1. **Wrapper com animacao** em volta das disciplinas de cada grupo:

```tsx
{/* Subject rows container with animation */}
<div
  className="grid transition-all duration-300 ease-in-out overflow-hidden"
  style={{
    gridTemplateRows: expandedGroups.has(group.classId) ? '1fr' : '0fr'
  }}
>
  <div className="min-h-0">
    {group.subjects.map((subject, index) => {
      // ... existing row content ...
    })}
  </div>
</div>
```

2. **Animacao do icone chevron** para rotacao suave:

```tsx
<ChevronRight 
  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
    expandedGroups.has(group.classId) ? 'rotate-90' : ''
  }`}
/>
```

---

### Parte 2: Campo de Pesquisa por Nome da Turma

#### Abordagem

Adicionar um campo `Input` com icone de busca que filtra os grupos pelo nome da turma em tempo real.

#### Novo Estado

```typescript
const [searchTerm, setSearchTerm] = useState('');
```

#### Novo Import

```typescript
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
```

#### Logica de Filtragem

Adicionar um `useMemo` para filtrar `groupedSubjects` pelo termo de busca:

```typescript
// Filter groups by search term
const searchedGroups = useMemo(() => {
  if (!searchTerm.trim()) return groupedSubjects;
  
  const term = searchTerm.toLowerCase().trim();
  return groupedSubjects.filter(group => 
    group.className.toLowerCase().includes(term)
  );
}, [groupedSubjects, searchTerm]);
```

#### UI do Campo de Pesquisa

Adicionar entre os filtros existentes:

```tsx
<div className="relative flex-1 max-w-xs">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Buscar turma..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-8 pr-8"
  />
  {searchTerm && (
    <button
      onClick={() => setSearchTerm('')}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  )}
</div>
```

---

### Estrutura Visual do Campo de Busca

```text
+----------------------------------------------------------------+
|  Ano: [v]  Turma: [v]  Professor: [v]  Status: [v]             |
|                                                                 |
|  [🔍 Buscar turma...________________X]    [Expandir] [Colapsar] |
+----------------------------------------------------------------+
```

---

### Resumo das Mudancas

| Linha | Mudanca |
|-------|---------|
| ~4 | Adicionar `Search, X` aos imports do Lucide |
| ~10 | Adicionar import do `Input` component |
| ~70 | Adicionar estado `searchTerm` |
| ~183 | Adicionar `searchedGroups` useMemo apos `groupedSubjects` |
| ~459 | Adicionar campo de busca na barra de ferramentas |
| ~539-638 | Substituir `groupedSubjects` por `searchedGroups` no map |
| ~555-559 | Substituir `ChevronDown/ChevronRight` por um unico `ChevronRight` com rotacao |
| ~583-638 | Envolver linhas de disciplinas com wrapper animado |

---

### Comportamento Final

| Acao | Resultado |
|------|-----------|
| Digitar no campo de busca | Filtra turmas em tempo real pelo nome |
| Clicar no X do campo | Limpa a busca |
| Clicar no cabecalho da turma | Animacao suave de expansao/colapsamento |
| Icone chevron | Rotaciona suavemente 90 graus |

---

### Observacoes

- A animacao usa `grid-template-rows` que funciona bem com conteudo dinamico
- O campo de busca limpa automaticamente quando o usuario clica no X
- A filtragem e case-insensitive (ignora maiusculas/minusculas)
- Compativel com exportacao PDF/Imagem (estado visual atual e exportado)

