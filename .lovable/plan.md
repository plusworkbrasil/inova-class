## Problema

A rota `/student-absences` está restrita apenas ao papel `student` em `src/App.tsx`, mas a página é o relatório "Alunos Faltosos" exibido nos menus de admin, tutor e coordenador. Por isso o admin é jogado de volta para o dashboard.

Além disso, a própria página `StudentAbsences.tsx` faz uma checagem manual de papel que exclui `secretary` e `instructor` (que também aparecem em fluxos staff).

## Mudanças

1. **`src/App.tsx`** — alterar o `RoleGuard` da rota `/student-absences` de `['student']` para os papéis que de fato usam o relatório:
   - `admin`, `secretary`, `coordinator`, `tutor`, `instructor` (constante `INSTRUCTOR_STAFF` já existe e cobre admin/secretary/instructor/tutor; adicionar `coordinator`).

2. **`src/pages/StudentAbsences.tsx`** — ajustar a checagem interna `if (!profile || !['admin','coordinator','tutor'].includes(...))` para liberar os mesmos papéis acima, mantendo coerência com o `RoleGuard` e com os menus já existentes.

Nenhuma alteração de RLS/banco é necessária — o hook `useStudentsWithExcessAbsences` já consulta tabelas (`attendance`, `subjects`, `profiles`, `classes`) cujas políticas permitem leitura para esses papéis.

## Resultado

Admin (e demais papéis staff) passa a acessar "Alunos Faltosos" normalmente sem ser redirecionado para o Dashboard.