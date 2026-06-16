## Objetivo
Permitir que apenas `jasprintbrasil@gmail.com` e `pluswork.com.br@gmail.com` acessem o sistema enquanto o modo manutenção estiver ativo. Todos os outros usuários continuam bloqueados (login e dentro do app).

## Abordagem
Criar uma lista de e-mails "bypass" usada tanto no login quanto no gate dentro do app. A lista fica em uma constante no frontend (simples, fácil de editar) e é verificada contra o e-mail do usuário autenticado.

```ts
// src/lib/maintenanceBypass.ts
export const MAINTENANCE_BYPASS_EMAILS = [
  'jasprintbrasil@gmail.com',
  'pluswork.com.br@gmail.com',
];
export const canBypassMaintenance = (email?: string | null) =>
  !!email && MAINTENANCE_BYPASS_EMAILS.includes(email.toLowerCase());
```

## Mudanças

1. **Novo arquivo** `src/lib/maintenanceBypass.ts` — lista + helper.

2. **`src/hooks/useSupabaseAuth.ts`** (bloco do `signInWithPassword`)
   - Hoje: se manutenção está ON → bloqueia qualquer login.
   - Novo: se manutenção está ON **e** o e-mail digitado não está na lista → bloqueia. Caso contrário, segue normalmente.

3. **`src/components/layout/Layout.tsx`** (gate de manutenção)
   - Hoje: se manutenção ON → mostra `MaintenanceLock` para todos, exceto admin em `/configuracoes`.
   - Novo: também libera quando `canBypassMaintenance(user.email)` for verdadeiro — esses dois e-mails navegam pelo sistema normalmente.

4. **`src/pages/Auth.tsx`** (alerta na tela de login)
   - Mantém o alerta vermelho "Sistema em manutenção" visível para todos (não vamos expor quem pode entrar). Apenas o submit é que diferencia.

## Comportamento final (manutenção ON)
- `jasprintbrasil@gmail.com` e `pluswork.com.br@gmail.com`: login normal + acesso total.
- Qualquer outro usuário: bloqueado no login e, se já estava logado, vê a tela `MaintenanceLock`.
- Admin fora da lista: continua bloqueado, mas ainda consegue acessar `/configuracoes` para desligar a manutenção (regra atual preservada).

## Fora do escopo
- Não muda banco de dados, RPCs ou RLS.
- Não muda o toggle em Configurações.
