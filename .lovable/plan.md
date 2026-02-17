
## Atualizar coluna "Matrícula" no dialog de detalhes de frequência

### Problema
A coluna "Matrícula" no dialog de detalhes de frequência exibe o UUID bruto do aluno (ex: `01abdad2-7c06-49ef-96c3-2cfdc64dbc41`), que não é amigável para o usuário.

### Solução

**Arquivo: `src/components/ui/attendance-group-details-dialog.tsx`**

1. **Renomear coluna** (linha 138): "Matrícula" -> "Nº Aluno"
2. **Exibir dado amigável** (linha 157): Trocar `record.student_id` por `record.student_enrollment || record.student_number || 'N/A'`

Isso exibirá o número de matrícula real do aluno (campo `student_enrollment`) ou o número do aluno (`student_number`), que já estão disponíveis no tipo `Attendance` do hook `useSupabaseAttendance`.

### Arquivo alterado
- `src/components/ui/attendance-group-details-dialog.tsx` (2 alterações: linhas 138 e 157)
