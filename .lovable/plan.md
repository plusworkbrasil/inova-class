

## Correcao do Deslocamento de Datas na Matriz de Chamadas

### Problema Identificado
As datas das chamadas estao sendo exibidas com **1 dia a menos** do que o correto. Por exemplo:
- O banco de dados tem registros para **12/12**, mas a tela mostra **11/12**
- O registro de **18/12** aparece como **17/12**

Isso acontece porque o JavaScript interpreta `new Date("2025-12-12")` como meia-noite UTC (00:00 UTC). Quando o `date-fns` formata essa data, ele converte para o fuso horario de Brasilia (UTC-3), resultando em **11/12 as 21:00** -- ou seja, o dia anterior.

### Solucao
Corrigir a funcao `formatDate` no componente `subject-attendance-matrix-dialog.tsx` para evitar a conversao de fuso horario. A data vinda do banco ("2025-12-12") deve ser tratada como data local, nao UTC.

### Detalhes Tecnicos

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

Alterar a funcao `formatDate` (linhas 49-55) para parsear a data como local em vez de UTC:

```typescript
// ANTES (bugado - interpreta como UTC):
const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), 'dd/MM', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

// DEPOIS (correto - interpreta como data local):
const formatDate = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), 'dd/MM', { locale: ptBR });
  } catch {
    return dateStr;
  }
};
```

Tambem verificar o mesmo problema no hook `useInstructorSubjectAttendance.ts` na linha 126 onde as datas sao ordenadas:

```typescript
// Linha 126 - mesma correcao na ordenacao
const dates = [...new Set(attendances.map(a => a.date))]
  .sort((a, b) => a.localeCompare(b)); // strings ISO ja ordenam corretamente
```

### Arquivos Alterados
- **`src/components/ui/subject-attendance-matrix-dialog.tsx`** - corrigir `formatDate` para usar data local
- **`src/hooks/useInstructorSubjectAttendance.ts`** - corrigir ordenacao de datas (opcional, mas mais seguro)

### O Que NAO Muda
- A logica de busca de dados no banco permanece igual
- A estrutura da tabela/matriz permanece igual
- Os calculos de porcentagem de presenca permanecem iguais
- A exportacao PDF/Excel permanece igual
