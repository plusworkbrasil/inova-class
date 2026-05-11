## Problema

Ao tentar criar um novo usuário (ex.: outro Administrador), a edge function `create-user` retorna:

> Access denied: Cannot create user with role 'admin'

A causa: o array `allowedRoles` na função só inclui `['student', 'instructor', 'teacher', 'secretary']`, mas o formulário (`UserForm.tsx`) oferece também `admin`, `coordinator` e `tutor`. Logo, qualquer tentativa de criar admin/coordenador/tutor é bloqueada — mesmo sendo o chamador um administrador.

## Correção

Editar `supabase/functions/create-user/index.ts` para alinhar as roles permitidas com as opções reais do formulário e o enum `app_role`:

- **Admin** pode criar: `admin`, `coordinator`, `secretary`, `tutor`, `instructor`, `student`
- **Secretary** pode criar apenas: `instructor`, `student` (mantém escopo limitado, sem poder criar admin/secretary/coordinator/tutor)
- Remover a entrada inválida `'teacher'` (não existe no enum `app_role`).

Substituir o bloco atual por uma lógica baseada no papel do chamador:

```ts
const allowedRoles = callerRole === 'admin'
  ? ['admin', 'coordinator', 'secretary', 'tutor', 'instructor', 'student']
  : ['instructor', 'student']

if (!allowedRoles.includes(userData.role)) {
  throw new Error(`Access denied: Cannot create user with role '${userData.role}'`)
}
```

Nenhuma outra alteração necessária — o fluxo de criação, rollback e atribuição de role em `user_roles` já funciona corretamente.

## Fora de escopo

- Sem alterações em RLS, banco ou no frontend.
- Sem mudanças no `UserForm` (as opções já estão corretas).
