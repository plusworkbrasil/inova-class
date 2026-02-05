

## Plano: Corrigir Texto Cortado na Exportação do Gráfico Gantt

### Problema Identificado

Na exportação do gráfico Gantt (PDF ou imagem), o texto das colunas "Disciplina", "Turma" e "Professor" está sendo cortado porque as classes CSS `truncate` aplicam:
- `overflow: hidden`
- `text-overflow: ellipsis`
- `white-space: nowrap`

Isso faz com que texto longo seja cortado com "..." na visualização e especialmente na exportação.

---

### Arquivo a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Permitir texto completo visível na exportação |

---

### Solução

Remover a classe `truncate` dos textos da coluna lateral e permitir que o texto quebre em múltiplas linhas quando necessário, usando `break-words` para evitar overflow horizontal.

#### Mudanças nas Linhas 448-453

**Antes:**
```tsx
<div className="w-64 flex-shrink-0 p-2 text-xs" title={`${subject.name} - ${subject.class_name}${subject.teacher_name ? ` - ${subject.teacher_name}` : ''}`}>
  <div className="font-medium truncate">{subject.name}</div>
  <div className="text-muted-foreground truncate">{subject.class_name}</div>
  {subject.teacher_name && (
    <div className="text-muted-foreground/70 truncate text-[10px]">{subject.teacher_name}</div>
  )}
</div>
```

**Depois:**
```tsx
<div className="w-64 flex-shrink-0 p-2 text-xs overflow-hidden" title={`${subject.name} - ${subject.class_name}${subject.teacher_name ? ` - ${subject.teacher_name}` : ''}`}>
  <div className="font-medium break-words">{subject.name}</div>
  <div className="text-muted-foreground break-words">{subject.class_name}</div>
  {subject.teacher_name && (
    <div className="text-muted-foreground/70 break-words text-[10px]">{subject.teacher_name}</div>
  )}
</div>
```

#### Ajustar Altura da Linha (Linha 455)

Como o texto pode ocupar mais de uma linha, alterar a altura da barra do Gantt de fixa para mínima:

**Antes:**
```tsx
<div className="flex-1 relative h-12 flex items-center">
```

**Depois:**
```tsx
<div className="flex-1 relative min-h-12 flex items-center">
```

---

### Detalhes Técnicos

| Classe Anterior | Classe Nova | Efeito |
|-----------------|-------------|--------|
| `truncate` | `break-words` | Permite quebra de palavras longas |
| `h-12` | `min-h-12` | Altura mínima, mas pode crescer se necessário |

---

### Resultado Esperado

| Antes (Exportação) | Depois (Exportação) |
|--------------------|---------------------|
| "React is..." | "React is" (completo) |
| "Jovem Tech T02ABC..." | "Jovem Tech T02ABC - Noite" (completo) |
| "Jailson Sil..." | "Jailson Silva" (completo) |

---

### Visualização do Problema vs Solução

```text
ANTES (cortado):
+---------------------------+------------------------------------+
| React is...               |  ▓▓▓▓▓                             |
| Jovem Tech T02ABC...      |                                    |
| Jailson Sil...            |                                    |
+---------------------------+------------------------------------+

DEPOIS (completo):
+---------------------------+------------------------------------+
| React is                  |  ▓▓▓▓▓                             |
| Jovem Tech T02ABC - Noite |                                    |
| Jailson Silva             |                                    |
+---------------------------+------------------------------------+
```

