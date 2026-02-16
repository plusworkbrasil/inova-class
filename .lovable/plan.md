

## Correcao da Inconsistencia de Datas na Frequencia

### Problema Identificado

O banco de dados possui **8.456 registros** de frequencia, mas o Supabase tem um limite padrao de **1.000 linhas** por consulta. A funcao RPC `get_attendance_with_details` retorna dados ordenados por `date DESC`, entao apenas os ~1.000 registros mais recentes sao carregados. Registros de datas anteriores (como 12/12/2025 da turma T04B) ficam fora desse limite e nao aparecem na tela.

Alem disso, a linha 244 do `Attendance.tsx` usa `new Date().toISOString().split('T')[0]` para calcular "hoje", o que pode gerar data errada por causa do UTC (por exemplo, mostrar o dia anterior apos 21h no horario de Brasilia).

### Solucao

**1. Alterar a funcao RPC no banco de dados** para aceitar filtros de data/turma/disciplina e aplicar paginacao diretamente no SQL, evitando o limite de 1.000 linhas e trazendo apenas os dados necessarios.

**2. Corrigir o calculo de "hoje"** na linha 244 de `Attendance.tsx`, trocando `new Date().toISOString().split('T')[0]` por `getTodayInBrasilia()` que ja existe em `src/lib/utils.ts`.

### Detalhes Tecnicos

**Migracao SQL - Recriar funcao RPC com filtros:**

```sql
CREATE OR REPLACE FUNCTION get_attendance_with_details(
  p_class_id uuid DEFAULT NULL,
  p_subject_id uuid DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_limit integer DEFAULT 5000
)
RETURNS TABLE(...) AS $$
  SELECT ...
  FROM attendance a
  LEFT JOIN profiles p ON p.id = a.student_id
  LEFT JOIN classes c ON c.id = a.class_id
  LEFT JOIN subjects s ON s.id = a.subject_id
  WHERE 
    (autorizacao por role - mesmo codigo atual)
    AND (p_class_id IS NULL OR a.class_id = p_class_id)
    AND (p_subject_id IS NULL OR a.subject_id = p_subject_id)
    AND (p_start_date IS NULL OR a.date >= p_start_date)
    AND (p_end_date IS NULL OR a.date <= p_end_date)
  ORDER BY a.date DESC, a.created_at DESC
  LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Arquivo: `src/hooks/useSupabaseAttendance.ts`**

Alterar `fetchAttendance` para passar filtros para a RPC e aumentar o limite. Aceitar parametros opcionais de filtro (class_id, subject_id, start_date, end_date).

**Arquivo: `src/pages/Attendance.tsx`**

1. Linha 244: trocar `new Date().toISOString().split('T')[0]` por `getTodayInBrasilia()`
2. Passar os filtros selecionados (turma, disciplina, periodo) para o hook `useSupabaseAttendance`, fazendo a filtragem no servidor em vez de no cliente
3. Chamar `refetch` quando os filtros mudarem

### Arquivos Alterados

- **Migracao SQL**: recriar `get_attendance_with_details` com parametros de filtro e limite de 5000
- **`src/hooks/useSupabaseAttendance.ts`**: passar filtros para a chamada RPC
- **`src/pages/Attendance.tsx`**: corrigir calculo de "hoje" com `getTodayInBrasilia()` e passar filtros para o hook

### O Que NAO Muda

- A interface visual da tabela de frequencia permanece igual
- A logica de agrupamento (`getGroupedAttendance`) permanece igual
- Os formularios de criacao/edicao permanecem iguais
- As politicas RLS e a autorizacao por role dentro da RPC permanecem iguais

