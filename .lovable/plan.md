

## Corrigir coluna "N Aluno" mostrando N/A

### Problema
Os campos `enrollment_number` e `student_id` (texto) dos perfis estao NULL para todos os alunos. O numero real do aluno esta no campo `auto_student_id` (inteiro auto-incrementado), que nao e retornado pela funcao RPC `get_attendance_with_details`.

### Solucao

**1. Atualizar a funcao RPC `get_attendance_with_details` (ambas as versoes)**

Adicionar `p.auto_student_id` ao SELECT e ao retorno das duas versoes da funcao (com e sem parametros).

**2. Atualizar o tipo `Attendance` no hook**

**Arquivo: `src/hooks/useSupabaseAttendance.ts`**
- Adicionar campo `auto_student_id?: number` na interface `Attendance` (linha ~24)

**3. Atualizar a celula no dialog**

**Arquivo: `src/components/ui/attendance-group-details-dialog.tsx`**
- Alterar linha 157 para incluir `auto_student_id` no fallback:
  `record.auto_student_id || record.student_enrollment || record.student_number || 'N/A'`

### Alteracoes

1. **Migracao SQL**: Recriar as 2 versoes de `get_attendance_with_details` adicionando `p.auto_student_id` ao SELECT e ao RETURNS TABLE
2. **`src/hooks/useSupabaseAttendance.ts`**: Adicionar `auto_student_id?: number` na interface
3. **`src/components/ui/attendance-group-details-dialog.tsx`**: Usar `auto_student_id` como primeira opcao de exibicao

