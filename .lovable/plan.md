

# Plano: Mostrar todos os alunos com notas, independente do status

## Problema
Na linha 103 do `useInstructorSubjectGrades.ts`, o filtro `.eq('status', 'active')` exclui alunos inativos ou transferidos. Se um aluno recebeu notas na disciplina mas foi movido para outra turma e ficou inativo, ele desaparece da exportação.

## Solução
Remover o filtro `.eq('status', 'active')` na busca de perfis (linha 103). Todos os alunos que têm presença ou notas registradas na disciplina devem aparecer, independente do status atual.

## Alteração

**Arquivo:** `src/hooks/useInstructorSubjectGrades.ts` (linha 103)

Remover `.eq('status', 'active')` da query de perfis. A busca ficará:

```typescript
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number')
  .in('id', allStudentIds)
  .order('name');
```

Apenas 1 linha removida, sem impacto em outras funcionalidades.

