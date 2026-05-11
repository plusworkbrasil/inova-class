## Causa raiz (confirmada nos logs do Postgres)

Ao criar um usuário pela edge function `create-user`, o `supabaseAdmin.auth.admin.createUser` retorna `Database error creating new user` (`unexpected_failure`).

Investigando os logs do Postgres na mesma janela das tentativas, aparece:

```
ERROR: insert or update on table "audit_logs" violates foreign key constraint "audit_logs_user_id_fkey"
ERROR: current transaction is aborted, commands ignored until end of transaction block
```

Cadeia do problema:

1. `auth.admin.createUser` insere em `auth.users` → dispara o trigger `on_auth_user_created` → `handle_new_user()` insere em `public.profiles`.
2. A inserção em `profiles` dispara o trigger `audit_profiles_changes` → `audit_table_changes()`.
3. Dentro dessa função, `v_user := auth.uid()` retorna **NULL** (a chamada veio do service role da edge function, sem sessão de usuário no contexto do Postgres).
4. A função insere em `audit_logs` usando `COALESCE(v_user, '00000000-0000-0000-0000-000000000000'::uuid)` como `user_id`.
5. `audit_logs.user_id` tem FK para `auth.users(id)` e o UUID zero não existe → violação de FK → toda a transação do `createUser` aborta → o auth retorna `unexpected_failure`.

Isso explica por que o erro só aparece agora: o trigger genérico de auditoria começou a logar profiles/user_roles e qualquer INSERT feito sem sessão (admin createUser, jobs, edge functions com service role) cai nessa armadilha. O ajuste anterior em `allowedRoles` estava correto, mas o pipeline morre antes — daí persistir.

## Correção

Migração no banco (uma transação):

1. Tornar `public.audit_logs.user_id` **nullable**:
   ```sql
   ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;
   ```
2. Atualizar `public.audit_table_changes()` para usar `NULL` quando não houver usuário autenticado (em vez do UUID zero), preservando o restante da lógica:
   ```sql
   INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
   VALUES (v_user, v_action, TG_TABLE_NAME, v_record_id, v_fields);
   ```
   (remover o `COALESCE(..., '00000000-...')`).

Com isso:
- Inserts feitos por triggers durante `auth.admin.createUser` registram a auditoria com `user_id = NULL` (representando "sistema/automação"), sem violar FK.
- A FK continua íntegra para todos os logs originados de ações de usuários reais.
- Nenhuma alteração de RLS, de outras funções ou da edge function `create-user` é necessária.

## Validação

Após a migração, testar via UI a criação de um usuário com role `admin` (ex.: o caso da Andressa). Esperado: `200 OK`, novo usuário criado, registro em `user_roles` inserido, sem erros nos logs do Postgres nem da edge function.

## Fora de escopo

- Sem mudanças no frontend, RLS, ou outras edge functions.
- Sem reescrita do sistema de auditoria; apenas o tratamento de `user_id` nulo.
