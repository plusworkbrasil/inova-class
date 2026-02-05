

## Plano: Corrigir Alinhamento das Barras do Gantt com os Meses

### Problema Identificado

As barras do Gantt não estão alinhadas corretamente com as colunas de meses porque:

1. **Header dos meses**: Usa `display: flex` onde cada mês tem largura percentual calculada
2. **Área das barras**: Usa `position: absolute` com `left` em porcentagem

O problema é que o flexbox distribui o espaço de forma diferente do posicionamento absoluto, causando desalinhamento visual entre as barras e os meses correspondentes.

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/charts/SubjectsGanttChart.tsx` | **MODIFICAR** | Unificar sistema de posicionamento |

---

### Solucao

Modificar o header para usar o mesmo sistema de posicionamento absoluto que as barras, garantindo alinhamento perfeito.

#### Mudanca no Header (Linhas 421-435)

**Antes:**
```tsx
<div className="flex-1 flex">
  {months.map((month, index) => {
    const { widthPercent } = calculateMonthPosition(month);
    
    return (
      <div
        key={index}
        className="text-center p-2 text-xs font-medium border-l border-border bg-muted"
        style={{ width: `${widthPercent}%` }}
      >
        {format(month, 'MMM yyyy', { locale: ptBR })}
      </div>
    );
  })}
</div>
```

**Depois:**
```tsx
<div className="flex-1 relative">
  {months.map((month, index) => {
    const { leftPercent, widthPercent } = calculateMonthPosition(month);
    
    return (
      <div
        key={index}
        className="absolute text-center p-2 text-xs font-medium border-l border-border bg-muted h-full flex items-center justify-center"
        style={{ 
          left: `${leftPercent}%`, 
          width: `${widthPercent}%` 
        }}
      >
        {format(month, 'MMM yyyy', { locale: ptBR })}
      </div>
    );
  })}
</div>
```

---

### Detalhes Tecnicos

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Container header | `flex` | `relative` |
| Celulas de mes | `width: %` | `position: absolute` + `left: %` + `width: %` |
| Alinhamento | Flexbox independente | Mesmo sistema das barras |

---

### Porque Isso Funciona

Ambos os sistemas (header e barras) usarao o mesmo calculo de posicionamento:

```typescript
const calculateMonthPosition = (month: Date) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const widthPercent = (daysInMonth / totalDays) * 100;
  const leftPercent = (differenceInDays(monthStart, timelineStart) / totalDays) * 100;
  return { leftPercent, widthPercent };
};
```

As barras ja usam esse calculo corretamente. Ao aplicar o mesmo sistema ao header, os meses e as barras ficarao perfeitamente alinhados.

---

### Mudanca Adicional - Altura do Container do Header

Adicionar altura fixa ao container do header para que os elementos absolutos tenham referencia:

```tsx
<div className="flex-1 relative h-10">
```

---

### Visualizacao do Resultado

```text
ANTES (desalinhado):
|  JAN  |   FEV   |  MAR  |
     [████████]        <- barra nao alinhada

DEPOIS (alinhado):
|  JAN  |   FEV   |  MAR  |
|  [████████]    |     <- barra alinhada com os meses
```

---

### Resumo das Mudancas

1. Trocar `flex-1 flex` por `flex-1 relative h-10` no container do header
2. Adicionar `position: absolute`, `left`, e `h-full` nas celulas de mes
3. Adicionar `flex items-center justify-center` para centralizar o texto verticalmente

