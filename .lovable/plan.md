

## Adicionar Busca e Filtros na pagina de Gerenciamento de Disciplinas

### Problema
A pagina de Disciplinas (`/subjects`) ja possui a logica de filtragem por nome no codigo (estado `searchTerm` na linha 31 e filtro na linha 343), mas **nao exibe nenhum campo de busca nem filtros na interface**. O usuario nao tem como procurar disciplinas ou filtrar por turma.

### Solucao
Adicionar um card de filtros entre os cards de estatisticas e a listagem, contendo:
1. **Campo de busca por texto** - para procurar disciplinas pelo nome (ja conectado ao estado existente `searchTerm`)
2. **Filtro por turma (Select)** - dropdown com todas as turmas disponiveis para filtrar disciplinas de uma turma especifica
3. **Filtro por status** - dropdown para filtrar entre Ativo/Inativo/Todos

### Detalhes Tecnicos

**Arquivo: `src/pages/Subjects.tsx`**

1. Adicionar dois novos estados:
   - `selectedClassFilter` (string) - ID da turma selecionada ou "all"
   - `selectedStatusFilter` (string) - "all", "ativo" ou "inativo"

2. Inserir um card de filtros (entre as linhas 404-406) com:
   - Input de busca com icone de lupa (mesmo padrao da pagina de Turmas/Classes)
   - Select de turma populado a partir de `classes` ja carregado pelo hook `useSupabaseClasses`
   - Select de status com opcoes Todos/Ativo/Inativo

3. Atualizar a logica de `filteredSubjects` (linha 343) para incluir os novos filtros:
   ```typescript
   const filteredSubjects = subjects.filter(subject => {
     const matchesSearch = subject.name?.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesClass = selectedClassFilter === 'all' || subject.class_id === selectedClassFilter;
     const matchesStatus = selectedStatusFilter === 'all' || subject.status === selectedStatusFilter;
     return matchesSearch && matchesClass && matchesStatus;
   });
   ```

4. Importar o componente `Select` de `@/components/ui/select` (SelectTrigger, SelectContent, SelectItem, SelectValue)

### Arquivos Alterados
- **`src/pages/Subjects.tsx`** - unico arquivo modificado

### O Que NAO Muda
- A estrutura de cards de disciplinas agrupadas por turma permanece igual
- Os botoes de acao (editar, excluir, exportar) permanecem iguais
- Os hooks e dados carregados permanecem os mesmos
- O layout geral da pagina permanece igual

