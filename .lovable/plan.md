

# Plano: Mostrar alunos com frequência mesmo após mudança de turma

## Problema
O hook `useInstructorSubjectAttendance.ts` (linhas 65-69) busca alunos apenas por `class_id` e `status = 'active'`. Alunos que foram movidos para outra turma ou desativados não aparecem na lista de frequência, mesmo tendo registros de presença na disciplina.

É o mesmo problema que foi corrigido para notas.

## Solução
Aplicar a mesma lógica usada no `useInstructorSubjectGrades.ts`: buscar os IDs dos alunos diretamente da tabela `attendance` e então buscar seus perfis sem filtrar por `class_id` nem `status`.

## Alteração

**Arquivo:** `src/hooks/useInstructorSubjectAttendance.ts`

Substituir a lógica de busca de alunos (linhas 64-71) por:

```typescript
// 1. Buscar todos os student_ids com registros de frequência nesta disciplina
const { data: attendanceStudents, error: attStudError } = await supabase
  .from('attendance')
  .select('student_id')
  .eq('subject_id', subjectId)
  .eq('class_id', classId);

if (attStudError) throw attStudError;

const allStudentIds = [...new Set((attendanceStudents || []).map(a => a.student_id))];

if (allStudentIds.length === 0) {
  setStudents([]);
  setDates([]);
  setLoading(false);
  return;
}

// 2. Buscar perfis sem filtrar por class_id ou status
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number')
  .in('id', allStudentIds)
  .order('name');
```

O restante do hook (busca de attendance, transformação em matriz e filtro de `total_present > 0`) permanece igual.

1 arquivo alterado.

