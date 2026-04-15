

# Plano: Alterar média de aprovação de 7.0 para 5.0

## Alterações

### 1. `src/hooks/useInstructorSubjectGrades.ts` (linha 200)
Trocar `average >= 7.0` por `average >= 5.0`.

### 2. `src/components/ui/subject-grades-export-dialog.tsx` (linha 246)
Trocar o texto da legenda de `Média ≥ 7.0` para `Média ≥ 5.0`, e `Média < 7.0` para `Média < 5.0`.

Duas linhas alteradas em dois arquivos.

