## Problema

Na lista de Frequência, todos os alunos exibem "Matrícula: N/A".

**Causa**: Os campos `student_id` e `enrollment_number` em `profiles` estão `NULL` para esses alunos. Quem está populado é a coluna `auto_student_id` (inteiro sequencial — ex: 1188, 1288, 1289...). Além disso, a função RPC `get_instructor_class_students` (usada por instrutores ao abrir a frequência) nem retorna esse campo.

Memória do projeto também define que o rótulo correto é **"Nº Aluno"**, não "Matrícula".

## Correção

1. **Migração no banco** — atualizar a função `get_instructor_class_students` para incluir `auto_student_id` no `RETURNS TABLE` e no `SELECT`.

2. **`src/components/forms/AttendanceForm.tsx`**
   - Adicionar `auto_student_id` ao tipo do estado `students`.
   - Incluir `auto_student_id` no `.select(...)` da consulta direta a `profiles` (ramo não-instrutor).
   - Trocar o rótulo `Matrícula:` por `Nº Aluno:` no card de cada aluno.
   - Trocar a expressão exibida para `student.auto_student_id ?? student.enrollment_number ?? student.student_id ?? 'N/A'`.

Nenhuma outra tela é tocada — somente a renderização da lista de frequência e a função RPC que a alimenta.

## Detalhes técnicos

```text
RPC get_instructor_class_students
  RETURNS TABLE(id uuid, name text, student_id text,
                enrollment_number text, auto_student_id int)
  SELECT DISTINCT p.id, p.name, p.student_id,
                  p.enrollment_number, p.auto_student_id
  ... (restante das condições inalterado)
```
