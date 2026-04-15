

# Plano: Corrigir exportação de notas em /subjects

## Problema identificado
O hook `useInstructorSubjectGrades.ts` filtra alunos **apenas por presença** (`is_present = true`). Alunos que têm notas lançadas mas não têm registro de presença na disciplina são excluídos da lista.

Exemplo real: na disciplina "C#" (48018abc), os alunos "Marcos Antônio Oliveira Campos" e "Eduardo de Jesus Santos" têm notas lançadas mas 0 registros de presença, então não aparecem na exportação.

## Solução
Alterar o hook `useInstructorSubjectGrades.ts` para buscar alunos que tenham **presença OU notas** na disciplina, em vez de apenas presença.

## Alteração

**Arquivo:** `src/hooks/useInstructorSubjectGrades.ts`

1. Além de buscar `student_id` da tabela `attendance`, buscar também `student_id` da tabela `grades` para o mesmo `subjectId`
2. Unir os dois conjuntos de IDs antes de buscar os perfis
3. Remover a condição que retorna vazio se não há alunos com presença (pois pode haver alunos só com notas)

Lógica resumida:
```text
studentIdsFromAttendance = attendance WHERE subject_id AND is_present
studentIdsFromGrades = grades WHERE subject_id
allStudentIds = union(studentIdsFromAttendance, studentIdsFromGrades)
→ buscar profiles WHERE id IN allStudentIds AND status = 'active'
```

Apenas 1 arquivo alterado, sem impacto em outras funcionalidades.

