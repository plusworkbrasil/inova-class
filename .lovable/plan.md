

## Plano: Incluir Todos Alunos Faltosos e Corrigir Filtro por Turma

### Problemas Identificados

1. **Filtro "mais de 3 faltas" exclui alunos**: O hook `useStudentsWithExcessAbsences` filtra apenas alunos com `total_absences > 3` (linha 100). Isso exclui alunos com 1, 2 ou 3 faltas.

2. **Filtro por turma usa `class_id` da tabela `attendance`**: Quando o filtro por turma e aplicado, ele filtra pelo `class_id` registrado na tabela `attendance`. Porem, o `class_id` na tabela attendance pode estar inconsistente com a turma real do aluno (campo `class_id` em `profiles`). Alem disso, a turma exibida na coluna "Turma" tambem vem do attendance e nao do profile do aluno.

### Mudancas Propostas

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useStudentsWithExcessAbsences.ts` | MODIFICAR | Remover filtro de `> 3 faltas`, incluir todos com pelo menos 1 falta |
| `src/pages/StudentAbsences.tsx` | MODIFICAR | Atualizar texto descritivo e ajustar filtro por turma para usar `class_id` do profile |

### Detalhes Tecnicos

#### 1. Hook `useStudentsWithExcessAbsences.ts`

- **Linha 99-100**: Alterar filtro de `item.total_absences > 3` para `item.total_absences >= 1` (incluir todos alunos com faltas)
- **Filtro por turma**: Quando `classId` e informado, filtrar pelo `class_id` do **profile do aluno** (nao do attendance). Isso significa:
  - Buscar todos os attendance sem filtro de class_id
  - Apos obter os profiles dos alunos, filtrar os resultados pelo `class_id` do profile

#### 2. Pagina `StudentAbsences.tsx`

- **Linha 103-104**: Atualizar texto de "mais de 3 faltas" para "com faltas em disciplinas ativas"

### Resultado Esperado

- A lista mostrara **todos os alunos que possuem pelo menos 1 falta** em disciplinas ativas
- O filtro por turma usara a turma cadastrada no perfil do aluno, garantindo consistencia
- Severidade continua funcionando: Critico (10+), Alerta (7-9), Atencao (1-6)

