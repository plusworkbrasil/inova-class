

# Plano: Mensagem para usuário sem telefone cadastrado

## Contexto
No fluxo "Esqueci minha senha" (plano anterior aprovado mas ainda não implementado), quando o usuário solicita redefinição de senha, o sistema busca o telefone no perfil para enviar o link via WhatsApp. Se o usuário não tiver telefone cadastrado, deve exibir a mensagem: **"Procure o administrador para cadastrar seu número de whatsapp"**.

## Alteração no plano original

Na Edge Function `request-password-reset`:
- Se o perfil for encontrado mas **não tiver telefone**, retornar `{ success: false, noPhone: true }` com status 200
- Se tiver telefone, segue o fluxo normal (gera token, envia WhatsApp)

No frontend `src/pages/Auth.tsx`:
- Ao receber `noPhone: true` da Edge Function, exibir um toast de aviso: **"Procure o administrador para cadastrar seu número de whatsapp"**
- Se `noPhone` for `false`, exibir toast de sucesso normalmente

## Resumo das alterações (integrado ao plano anterior)

### 1. Migration: tabela `password_reset_tokens` (sem mudança)

### 2. Edge Function `request-password-reset`
- Busca perfil pelo email
- Se não encontrado: mensagem genérica (segurança)
- Se encontrado **sem telefone**: retorna `{ success: false, noPhone: true }`
- Se encontrado **com telefone**: gera token, envia WhatsApp, retorna `{ success: true }`

### 3. Edge Function `reset-password-with-token` (sem mudança)

### 4. Frontend `src/pages/Auth.tsx`
```typescript
const result = await response.json();
if (result.noPhone) {
  toast.warning('Procure o administrador para cadastrar seu número de whatsapp');
} else {
  toast.success('Link de redefinição enviado via WhatsApp!');
}
```

### 5. Nova página `src/pages/ResetPassword.tsx` (sem mudança)
### 6. Rota em `src/App.tsx` (sem mudança)

## Arquivos criados/alterados
- `supabase/migrations/` — tabela `password_reset_tokens`
- `supabase/functions/request-password-reset/index.ts`
- `supabase/functions/reset-password-with-token/index.ts`
- `src/pages/ResetPassword.tsx`
- `src/pages/Auth.tsx`
- `src/App.tsx`

