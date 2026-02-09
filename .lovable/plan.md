
## Plano: Corrigir Criacao de Usuarios e Prevenir Falhas Parciais

### Problema Identificado

O usuario `vitoria-ts2016@hotmail.com` foi **parcialmente criado** no sistema:
- Existe no Supabase Auth (auth.users)
- Existe na tabela `profiles`
- **NAO tem role** na tabela `user_roles`

Isso causa dois problemas:
1. O usuario nao consegue operar no sistema (sem permissoes)
2. Tentar criar novamente falha com "User already registered"

---

### Correcoes Necessarias

#### 1. Correcao Imediata - Migration SQL

Inserir o role faltante para o usuario existente:

```sql
INSERT INTO user_roles (user_id, role, granted_by)
SELECT 
  '989299bd-5c33-4cc2-a07c-ef214fc77a5e',
  'instructor'::app_role,
  (SELECT id FROM profiles WHERE email = 'pluswork.com.br@gmail.com')
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = '989299bd-5c33-4cc2-a07c-ef214fc77a5e'
);
```

#### 2. Melhoria na Edge Function `create-user`

Modificar a edge function para tratar o cenario de usuario ja existente no auth, evitando falhas parciais no futuro.

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/create-user/index.ts` | **MODIFICAR** | Adicionar tratamento de usuario duplicado |

Mudancas na logica:

```text
ANTES:
  1. Criar usuario no auth
  2. Atualizar profile
  3. Inserir role
  (Se falha no passo 3, usuario fica sem role)

DEPOIS:
  1. Verificar se email ja existe no auth
     - Se existe: verificar se ja tem role
       - Se nao tem role: inserir role e retornar sucesso
       - Se ja tem role: retornar erro "usuario ja existe"
  2. Criar usuario no auth
  3. Atualizar profile
  4. Inserir role (com retry em caso de falha)
  5. Se role falhar: deletar usuario do auth (rollback)
```

Detalhes tecnicos:

- Adicionar verificacao previa de email existente via `supabaseAdmin.auth.admin.listUsers()`
- Tratar erro `User already registered` especificamente, verificando se o role existe
- Se o auth user existe mas o role nao, inserir o role automaticamente (recuperacao)
- Adicionar rollback: se a insercao do role falhar apos criar o auth user, deletar o auth user

---

### Comportamento Esperado Apos Correcao

| Cenario | Resultado |
|---------|-----------|
| Criar usuario novo | Funciona normalmente, cria auth + profile + role |
| Email ja existe COM role | Erro claro: "Usuario ja existe com este email" |
| Email ja existe SEM role | Recupera automaticamente, insere o role faltante |
| Falha ao inserir role | Rollback: deleta o usuario do auth para evitar orfaos |
