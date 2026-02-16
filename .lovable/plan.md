
## Ajustes na pagina "Minhas Notas" do instrutor

### Alteracoes

**Arquivo: `src/pages/TeacherGrades.tsx`**

1. **Remover botao "Nota Individual"** (linhas 192-195): Eliminar o botao `+ Nota Individual` do cabecalho, mantendo apenas o botao "Lancar Notas por Turma".

2. **Ordenar disciplinas no "Lancamento Rapido de Notas"** (linhas 258-283): Ordenar as disciplinas por `end_date` em ordem decrescente (disciplinas ministradas mais recentemente aparecem primeiro). As que nao tem `end_date` ficam no topo.

3. **Esmaecer disciplinas inativas**: Aplicar estilos visuais (opacidade reduzida, texto acinzentado) nos cards de disciplinas cujo `status` nao seja "active" (ou equivalente). A disciplina permanece visivel e clicavel, mas com aparencia esmaecida para indicar que nao esta ativa.

### Detalhes Tecnicos

- No cabecalho, remover linhas 192-195 (botao "Nota Individual") e o import de `Plus` se nao for mais usado
- Para ordenar, usar os dados de `subjects` (que contem `end_date` e `status`) cruzando com `instructorSubjects` pelo `id`
- Para esmaecer, adicionar `opacity-50` e um indicador visual (badge ou texto) nas disciplinas inativas
- Tambem remover o `GradeForm` dialog (linhas 443-451) e estados relacionados (`isGradeFormOpen`, `editingGrade`, `openCreateForm`, `openEditForm`) que ficam sem uso, a menos que o botao de editar na tabela ainda os use -- nesse caso, manter apenas o necessario para edicao

### Arquivos Alterados
- `src/pages/TeacherGrades.tsx`
