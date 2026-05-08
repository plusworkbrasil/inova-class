## Objetivo

Permitir que o aluno acesse, pelo menu lateral, **apenas suas próprias frequências**, em uma página exclusiva e somente leitura — sem botões de edição, lançamento, exportação em massa ou navegação para dados de terceiros.

## Situação atual

- No menu do aluno (`Navigation.tsx`) há o item **"Frequência"** apontando para `/attendance`.
- A rota `/attendance` é protegida por `RoleGuard` para `INSTRUCTOR_STAFF` (admin, secretary, instructor, tutor, coordinator) — ou seja, **o aluno hoje é redirecionado e não consegue ver nada**.
- A função RPC `get_attendance_with_details` já filtra automaticamente pelo `student_id = auth.uid()` quando o papel é `student`, então o backend já está pronto.

## Mudanças

### 1. Nova página `src/pages/MyAttendance.tsx`
Página somente leitura para o aluno autenticado:
- Cabeçalho: "Minhas Frequências" + descrição curta.
- **Cards-resumo** no topo: Total de aulas, Presenças, Faltas, % Frequência geral (com destaque vermelho se < 75% — seguindo o padrão do projeto).
- **Filtros simples**: disciplina (select) e período (data início / data fim). Sem filtros por turma/aluno.
- **Tabela** com colunas: Data, Disciplina, Status (badge "Presente"/"Falta"), Justificativa (se houver), Atividade do dia.
- Ordenação por data desc; paginação de 10 itens (padrão do projeto).
- **Sem nenhum botão** de editar, excluir, lançar, exportar massa ou abrir dialogs administrativos. Apenas visualização.

Fonte de dados: `useSupabaseAttendance` (que já chama `get_attendance_with_details` e respeita RLS por aluno) + `useSupabaseSubjects` para nome/lista de disciplinas.

### 2. Rota em `src/App.tsx`
Adicionar:
```
<Route path="/minhas-frequencias" element={
  <RoleGuard allowedRoles={['student']}><MyAttendance /></RoleGuard>
} />
```

### 3. Menu do aluno (`src/components/layout/Navigation.tsx`)
No array `menuItems.student`, trocar o destino do item **"Frequência"**:
- de `path: '/attendance'`
- para `path: '/minhas-frequencias'`

Nenhuma outra alteração no menu — o aluno continua vendo apenas: Dashboard, Meu Perfil, Minhas Notas, **Frequência**, Declarações, Histórico de Declarações.

### 4. Garantir bloqueio de acesso lateral
A rota `/attendance` permanece restrita a `INSTRUCTOR_STAFF` (já está). Caso o aluno tente digitar manualmente `/attendance`, o `RoleGuard` continua redirecionando — comportamento desejado.

## Fora de escopo

- Backend / RLS: nenhuma migração necessária (a RPC já filtra por `auth.uid()` para `student`).
- Outras rotas/menus de outros papéis.
- Exportação PDF individual (não foi solicitada).
