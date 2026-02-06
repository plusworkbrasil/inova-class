

## Plano: Agrupar Disciplinas por Turma no Grafico Gantt

### Objetivo

Reorganizar o grafico Gantt para agrupar visualmente as disciplinas por turma, facilitando a identificacao de quais disciplinas pertencem a mesma turma. Cada grupo tera:
- Um cabecalho destacado com o nome da turma e a cor correspondente
- Borda lateral colorida para identificacao visual
- Separador visual entre grupos de turmas diferentes

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Agrupar disciplinas por turma com separadores visuais |

---

### Estrutura Visual Proposta

```text
+---------------------------+--------------------------------------------+
| Disciplina / Turma / Prof |  JAN    FEV    MAR    ABR    MAI    JUN   |
+===========================+============================================+
| JOVEM TECH T02ABC - NOITE                        (6 disciplinas)       |
+---------------------------+--------------------------------------------+
| | Banco de Dados          |  ████████                                  |
| | Jailson Silva           |                                            |
+---------------------------+--------------------------------------------+
| | React                   |       ████████                             |
| | Maria Santos            |                                            |
+---------------------------+--------------------------------------------+
| | C#                      |            ████████                        |
| | Joao Lima               |                                            |
+---------------------------+--------------------------------------------+
| | React Native            |                  ████████                  |
| | Pedro Costa             |                                            |
+---------------------------+--------------------------------------------+
| | Computacao em Nuvens    |                        ████████            |
| | Ana Souza               |                                            |
+---------------------------+--------------------------------------------+
| | Ciclo de Projeto 02     |                              ████████      |
| | Carlos Dias             |                                            |
+===========================+============================================+
| JOVEM TECH T02XYZ - MANHA                        (4 disciplinas)       |
+---------------------------+--------------------------------------------+
| | Python                  |  ████████                                  |
| | Maria Santos            |                                            |
+---------------------------+--------------------------------------------+
```

---

### Mudancas Tecnicas

#### 1. Agrupar Disciplinas por Turma

Criar um `useMemo` para organizar as disciplinas filtradas em grupos por turma:

```typescript
// Group subjects by class
const groupedSubjects = useMemo(() => {
  const groups = new Map<string, { 
    classId: string; 
    className: string; 
    subjects: TimelineSubject[] 
  }>();
  
  filteredSubjects.forEach(subject => {
    const key = subject.class_id;
    if (!groups.has(key)) {
      groups.set(key, {
        classId: subject.class_id,
        className: subject.class_name,
        subjects: []
      });
    }
    groups.get(key)!.subjects.push(subject);
  });
  
  // Sort by class name
  return Array.from(groups.values())
    .sort((a, b) => a.className.localeCompare(b.className));
}, [filteredSubjects]);
```

#### 2. Renderizar com Cabecalhos de Grupo

Substituir o `map` simples por uma renderizacao aninhada:

```tsx
{/* Rows grouped by class */}
{groupedSubjects.map((group) => {
  const color = classColorMap.get(group.classId) || CLASS_COLORS[0];
  
  return (
    <div key={group.classId}>
      {/* Class header row */}
      <div 
        className="flex border-b-2 border-t-2"
        style={{ borderColor: color }}
      >
        <div 
          className="w-64 flex-shrink-0 p-2 font-semibold text-sm flex items-center gap-2"
          style={{ backgroundColor: `${color}15` }}
        >
          <div 
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="break-words">{group.className}</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {group.subjects.length}
          </Badge>
        </div>
        <div 
          className="flex-1"
          style={{ backgroundColor: `${color}08` }}
        />
      </div>
      
      {/* Subject rows within group */}
      {group.subjects.map((subject, index) => (
        <div
          key={subject.id}
          className={`flex border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
          style={{ borderLeftWidth: '3px', borderLeftColor: color }}
        >
          {/* ... existing row content ... */}
        </div>
      ))}
    </div>
  );
})}
```

#### 3. Ajustar Coluna Lateral

Na coluna lateral das disciplinas, remover o nome da turma (ja esta no cabecalho do grupo) e manter apenas disciplina + professor:

```tsx
<div className="w-64 flex-shrink-0 p-2 pl-4 text-xs overflow-hidden">
  <div className="font-medium break-words">{subject.name}</div>
  {subject.teacher_name && (
    <div className="text-muted-foreground/70 break-words text-[10px]">{subject.teacher_name}</div>
  )}
</div>
```

---

### Estilos Visuais

| Elemento | Estilo | Descricao |
|----------|--------|-----------|
| Cabecalho do grupo | `backgroundColor: ${color}15` | Fundo suave com cor da turma |
| Borda lateral | `borderLeftWidth: 3px, borderLeftColor: color` | Faixa colorida identificando o grupo |
| Borda superior/inferior do grupo | `border-b-2 border-t-2` com cor | Separador forte entre grupos |
| Badge de contagem | `text-[10px]` | Numero de disciplinas no grupo |

---

### Beneficios

| Antes | Depois |
|-------|--------|
| Disciplinas listadas individualmente | Disciplinas agrupadas por turma |
| Nome da turma repetido em cada linha | Nome da turma no cabecalho do grupo |
| Dificil identificar quais disciplinas sao da mesma turma | Identificacao visual clara por cor e agrupamento |
| Lista longa sem separacao | Grupos com separadores visuais |

---

### Ordenacao dentro do Grupo

As disciplinas dentro de cada grupo serao ordenadas por data de inicio, facilitando a visualizacao da sequencia cronologica do curso.

---

### Compatibilidade com Exportacao

As mudancas mantem compatibilidade com as exportacoes PDF e Imagem existentes, pois usam apenas CSS inline e classes Tailwind.

