
## Plano: Sincronizar Email do Thalles Vicente Rabelo

### Problema Raiz

O email no sistema de autenticação (`auth.users`) está diferente do email na tabela `profiles`:

| Local | Email |
|-------|-------|
| `profiles` (o que você vê na interface) | `thalles.vicente.nl@gmail.com` |
| `auth.users` (usado para login) | `thalles@inovase.org` |

Quando você alterou a senha pelo painel admin, ela foi alterada corretamente, mas o usuário está tentando logar com o email errado.

---

### Solução 1: Fazer login com o email correto (rápido)

O usuário pode fazer login **agora** usando:
- **Email:** `thalles@inovase.org` (o email real no auth)
- **Senha:** A nova senha que você definiu pelo admin

---

### Solução 2: Sincronizar o email no auth.users (permanente)

Criar uma ferramenta para sincronizar o email deste usuário específico ou usar a edge function existente.

#### Opção A: Via página de Configurações

Ir em **Configurações** > **Sincronização de Emails de Autenticação** e adicionar o email `thalles.vicente.nl@gmail.com` à lista de sincronização.

#### Opção B: Chamada direta à edge function

Executar a edge function `sync-auth-email-with-profiles` com o email do usuário para sincronizar.

---

### Implementação Recomendada

Adicionar uma funcionalidade na página de **Gerenciamento de Usuários** para sincronizar emails individuais, não apenas uma lista fixa.

#### Arquivo a modificar: `src/pages/Users.tsx`

Adicionar um botão "Sincronizar Email" ao lado do botão de alterar senha, que chama a edge function `sync-auth-email-with-profiles` para o usuário selecionado.

```typescript
const handleSyncEmail = async (userId: string, email: string) => {
  const { data, error } = await supabase.functions.invoke('sync-auth-email-with-profiles', {
    body: { emails: [email] }
  });
  
  if (error) {
    toast.error('Erro ao sincronizar email');
  } else {
    toast.success('Email sincronizado com sucesso');
  }
};
```

---

### Resultado Esperado

| Etapa | Ação | Resultado |
|-------|------|-----------|
| 1 | Sincronizar email | Email no auth.users muda de `thalles@inovase.org` para `thalles.vicente.nl@gmail.com` |
| 2 | Usuário faz login | Login com `thalles.vicente.nl@gmail.com` + senha nova funciona |

---

### Alternativa Imediata (sem código)

Se precisar que o usuário acesse **agora**, informe-o que o login deve ser feito com:
- **Email:** `thalles@inovase.org`
- **Senha:** A que você definiu pelo admin

Depois você pode sincronizar o email para corrigir permanentemente.
