
## Correcao da Edge Function notify-justification

### Problema Identificado
A edge function `notify-justification` usa `supabaseClient.auth.getClaims()` que **nao existe** na API do Supabase JS v2. Isso causa erro 401 sempre que a funcao e chamada, impedindo que as notificacoes sejam criadas.

### Correcao Necessaria

**Arquivo: `supabase/functions/notify-justification/index.ts`**

Substituir a verificacao de autenticacao quebrada (`getClaims`) por `getUser()`, que e o metodo correto no Supabase JS v2:

```typescript
// ANTES (quebrado):
const { data: claimsData, error: claimsError } =
  await supabaseClient.auth.getClaims(authHeader.replace("Bearer ", ""));
if (claimsError || !claimsData?.claims) { ... }

// DEPOIS (correto):
const { data: { user }, error: userError } =
  await supabaseClient.auth.getUser();
if (userError || !user) { ... }
```

### Resumo das Mudancas

1. **Unico arquivo alterado**: `supabase/functions/notify-justification/index.ts`
2. Trocar `auth.getClaims()` por `auth.getUser()` (linhas 35-42)
3. Ajustar a verificacao de erro para usar `userError` e `user` em vez de `claimsError` e `claimsData`

### O que NAO muda
- Toda a logica de buscar usuarios alvo (admin/coordinator/tutor) permanece igual
- A criacao das notificacoes permanece igual
- O frontend (Declarations.tsx, useNotifications, NotificationsPopover) permanece igual
- O fluxo de aprovacao e atualizacao automatica da frequencia permanece igual
