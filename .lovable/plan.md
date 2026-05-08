## Causa raiz

O instrutor está vendo apenas 7 dos 38 alunos ativos da turma "Jovem Tech T04AB Manhã" porque a função `get_instructor_class_students` (usada pelo formulário de Frequência) filtra alunos por `get_user_role(p.id) = 'student'` — e **31 dos 38 perfis ativos não possuem registro correspondente em `user_roles`**.

Com a recente migração de papéis (que removeu `profiles.role` em favor da tabela `user_roles`), perfis criados antes/durante essa transição (incluindo importações em lote, alunos pré-selecionados convertidos, e cadastros via Admin que não passaram pelo trigger) ficaram sem a linha em `user_roles`. Resultado:

- Total ativos na turma: 38
- Com `user_roles.role = 'student'`: 7
- **Sem qualquer linha em `user_roles`: 31**

Em todo o sistema, **140 perfis ativos estão sem `user_roles`**, então o problema é generalizado e afeta qualquer instrutor cuja turma contenha esses alunos órfãos. Também impacta listas de notas, exportações e qualquer RPC que use `has_role`/`get_user_role`.

## Correção proposta

### 1. Backfill imediato (migration)
Inserir em `user_roles` o papel `student` para todos os perfis ativos que estão na coluna `class_id` de uma turma e não têm linha na tabela:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'student'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.id IS NULL
  AND p.class_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

Isso restaura imediatamente a visibilidade dos 140 alunos órfãos para os instrutores.

### 2. Trigger preventivo
Criar/atualizar trigger `AFTER INSERT ON profiles` que, quando o novo perfil tiver `class_id` definido (indicando aluno) e ainda não houver entrada em `user_roles`, insira automaticamente `('student')`. Isso evita reincidência em cadastros futuros (Admin → Cadastrar Aluno, importações, conversão de Selecionados, etc.).

### 3. Verificação pós-fix
Após a migration:
- Reconfirmar contagem da turma T04AB (esperado: 38 alunos retornados pela RPC)
- Confirmar que demais turmas afetadas voltaram ao normal
- Login do instrutor → abrir "Registrar Frequência" → ver lista completa

## Arquivos afetados
- Nova migration SQL (backfill + trigger)
- Sem alterações em código frontend
- Sem alteração em RLS ou em `get_instructor_class_students` (a função está correta; o dado é que estava inconsistente)

## Fora de escopo
- Não mexer em `profiles`, autenticação, ou demais funções RPC
- Não alterar fluxos de Admin/Secretaria
