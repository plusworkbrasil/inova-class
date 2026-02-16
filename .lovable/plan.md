

## Aplicar ordenacao e esmaecimento na secao "Minhas Disciplinas e Turmas"

### Alteracao

**Arquivo: `src/pages/TeacherGrades.tsx`** (linhas 328-332)

Na secao "Minhas Disciplinas e Turmas", a lista de disciplinas (badges) atualmente usa `instructorSubjects` diretamente, sem ordenacao nem indicacao visual de disciplinas inativas.

A alteracao consiste em:

1. **Usar `sortedInstructorSubjects`** em vez de `instructorSubjects` para manter a mesma ordem decrescente por `end_date` ja implementada na secao "Lancamento Rapido".

2. **Esmaecer disciplinas inativas**: Aplicar `opacity-50` e adicionar o texto "(Inativa)" ao lado do nome da disciplina no badge, usando a mesma logica de verificacao de status ja existente (`subjectsDetails`).

### Codigo atual (linhas 328-332)
```
{instructorSubjects?.map(subject => (
  <Badge key={subject.id} variant="secondary">{subject.name}</Badge>
))}
```

### Codigo proposto
```
{sortedInstructorSubjects.map(subject => {
  const details = subjectsDetails[subject.id];
  const isActive = !details?.status || details.status === 'ativo' || details.status === 'active';
  return (
    <Badge key={subject.id} variant="secondary" className={!isActive ? 'opacity-50' : ''}>
      {subject.name}{!isActive ? ' (Inativa)' : ''}
    </Badge>
  );
})}
```

### Arquivo alterado
- `src/pages/TeacherGrades.tsx`
