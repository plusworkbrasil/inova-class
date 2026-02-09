

## Ajustar Badges de Severidade com Faixas Menores

### Problema
Atualmente, o badge de severidade so tem 3 faixas, e a menor ("Atencao") cobre de 1 a 6 faltas, que e uma faixa muito ampla. Com a inclusao de todos os alunos faltosos, faz sentido diferenciar melhor os niveis.

### Mudanca Proposta

| Arquivo | Acao |
|---------|------|
| `src/pages/StudentAbsences.tsx` | Atualizar funcao `getSeverityBadge` |

### Novas Faixas de Severidade

| Faltas | Nivel | Cor | Badge |
|--------|-------|-----|-------|
| 10+ | Critico | Vermelho (`bg-red-500`) | Critico (X) |
| 7-9 | Alerta | Laranja (`bg-orange-500`) | Alerta (X) |
| 4-6 | Atencao | Amarelo (`bg-yellow-500`) | Atencao (X) |
| 1-3 | Leve | Azul (`bg-blue-500`) | Leve (X) |

### Detalhe Tecnico

Modificar a funcao `getSeverityBadge` (linhas 65-73) em `src/pages/StudentAbsences.tsx` para adicionar a nova faixa:

```typescript
const getSeverityBadge = (absences: number) => {
  if (absences >= 10) {
    return <Badge variant="destructive" className="bg-red-500">Critico ({absences})</Badge>;
  } else if (absences >= 7) {
    return <Badge className="bg-orange-500 text-white">Alerta ({absences})</Badge>;
  } else if (absences >= 4) {
    return <Badge className="bg-yellow-500 text-white">Atencao ({absences})</Badge>;
  } else {
    return <Badge className="bg-blue-500 text-white">Leve ({absences})</Badge>;
  }
};
```

Apenas 1 arquivo modificado, mudanca pontual na funcao de badge.

