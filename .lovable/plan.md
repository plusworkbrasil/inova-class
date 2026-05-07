## Diagnóstico

No `RoleGuard.tsx` a decisão de "autorizado" depende de `profile.role`, mas o `profile` é carregado de forma assíncrona (via `setTimeout` dentro de `useSupabaseAuth`). O `loading` do hook fica `false` assim que `getSession()` termina — **antes** do profile ser efetivamente buscado.

Resultado: existe uma janela em que `loading = false`, `user` existe, mas `profile` ainda é `null` → `role` é `undefined` → `isAuthorized = false` → o guard executa `<Navigate to="/dashboard" replace />`. Como o Dashboard não tem RoleGuard, ele renderiza, espera o profile e fica lá. Por isso "quase tudo cai no dashboard" mesmo com role admin.

A prova está nos logs: o `Profile loaded` só aparece **depois** que a navegação já aconteceu.

Risco adicional: o mesmo race pode disparar a RPC `record_unauthorized_access_attempt` indevidamente (3 navegações rápidas → conta auto‑bloqueada).

## Correção proposta

Ajustar `src/components/auth/RoleGuard.tsx` para aguardar o profile antes de decidir:

1. Tratar como "ainda carregando" enquanto `loading || (user && !profile)` — exibir o spinner já existente, sem redirecionar e sem registrar tentativa.
2. Só avaliar `isAuthorized` / chamar `record_unauthorized_access_attempt` quando `profile` (e portanto `role`) estiver disponível.
3. Manter o restante da lógica (bloqueio de conta, toast, logout, notificação a admins) inalterada.

Nenhuma mudança de banco, RLS ou demais páginas é necessária — o problema é puramente de timing no guard.

## Detalhes técnicos

```text
RoleGuard render:
  if (loading || (user && !profile))  -> <Spinner/>
  if (!user)                          -> Navigate /auth
  if (profile.status === 'blocked')   -> logout + Navigate /auth
  if (!allowedRoles.includes(role))   -> record attempt + Navigate /dashboard
  else                                -> children
```

Opcional (não incluído por padrão, posso adicionar se quiser): também só registrar a tentativa após um pequeno debounce (ex.: 300 ms) para evitar falsos positivos quando o usuário navega rápido entre rotas.