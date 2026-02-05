

## Plano: Mostrar Nome do Professor nas Linhas do Gráfico Gantt

### Objetivo

Exibir o nome do professor em cada linha do gráfico Gantt, junto com a disciplina e turma, facilitando a identificação rápida sem precisar passar o mouse sobre a barra.

---

### Arquivo a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Adicionar nome do professor na coluna lateral |

---

### Mudanças

#### 1. Atualizar Header da Coluna

Mudar o título de "Disciplina - Turma" para "Disciplina / Turma / Professor":

```tsx
// Linha 381-382: Atualizar header
<div className="w-64 flex-shrink-0 p-2 font-semibold text-sm bg-muted">
  Disciplina / Turma / Professor
</div>
```

#### 2. Expandir Largura da Coluna

Aumentar a largura da coluna lateral para acomodar a informação adicional:

- De `w-48` (192px) para `w-64` (256px)

#### 3. Adicionar Nome do Professor nas Linhas

Atualizar a renderização de cada linha para incluir o professor:

```tsx
// Linhas 414-417: Atualizar para mostrar 3 linhas
<div className="w-64 flex-shrink-0 p-2 text-xs" title={`${subject.name} - ${subject.class_name}${subject.teacher_name ? ` - ${subject.teacher_name}` : ''}`}>
  <div className="font-medium truncate">{subject.name}</div>
  <div className="text-muted-foreground truncate">{subject.class_name}</div>
  {subject.teacher_name && (
    <div className="text-muted-foreground/70 truncate text-[10px]">{subject.teacher_name}</div>
  )}
</div>
```

---

### Locais de Mudança

| Linha | Mudança |
|-------|---------|
| 381 | Aumentar largura do header: `w-48` → `w-64` |
| 382 | Atualizar texto do header |
| 414 | Aumentar largura da coluna: `w-48` → `w-64` |
| 414-417 | Adicionar terceira linha com nome do professor |

---

### Interface Visual Esperada

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Disciplina / Turma / Professor                  JAN    FEV    MAR    ABR          │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Banco de Dados                                  ▓▓▓▓▓▓▓▓▓                          │
│  T02AB Tarde                                     └──────────────┘                   │
│  João Silva                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  React.js                                               ▓▓▓▓▓▓▓▓▓▓▓                 │
│  T02AB Tarde                                            └───────────────┘           │
│  Maria Santos                                                                       │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Python                                                        ▓▓▓▓▓▓▓▓▓▓           │
│  T02ABC Noite                                                  └──────────────┘     │
│  (sem professor)                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

**Estilização do nome do professor:**
- Fonte menor: `text-[10px]` (menor que o padrão `text-xs`)
- Cor mais suave: `text-muted-foreground/70` (70% opacidade)
- Truncate para nomes longos
- Mostrado apenas se `teacher_name` existir

**Ajustes de largura:**
- Header: `w-48` → `w-64`
- Linhas: `w-48` → `w-64`
- Altura das linhas permanece igual (h-12)

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Mostra: Disciplina + Turma | Mostra: Disciplina + Turma + Professor |
| Professor só no tooltip | Professor visível diretamente |
| Coluna 192px | Coluna 256px para acomodar mais texto |

