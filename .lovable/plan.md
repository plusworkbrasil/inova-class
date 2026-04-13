

# Plano: Filtrar apenas alunos ativos no lançamento de notas por disciplina

## Problema
No formulário "Lançar Notas por Disciplina", a RPC `get_instructor_students()` retorna alunos de todos os status (ativos, inativos, evadidos). O filtro client-side na linha 103-104 filtra apenas por `class_id`, sem verificar o status.

## Solução
Adicionar `.filter(student => student.status === 'active')` ao filtro existente em `src/components/forms/InstructorGradesBySubjectForm.tsx`.

### Alteração em `src/components/forms/InstructorGradesBySubjectForm.tsx` (linha 103-105)

De:
```typescript
const filteredStudents = (data || [])
  .filter(student => student.class_id === subject.class_id)
  .sort((a, b) => a.name.localeCompare(b.name));
```

Para:
```typescript
const filteredStudents = (data || [])
  .filter(student => student.class_id === subject.class_id && student.status === 'active')
  .sort((a, b) => a.name.localeCompare(b.name));
```

Uma única linha alterada, sem impacto em outras funcionalidades.

