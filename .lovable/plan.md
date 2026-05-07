## Problema

`/student-absences` redireciona admin para `/dashboard` mesmo com permissão concedida no `RoleGuard`.

**Causa raiz:** Em `src/pages/StudentAbsences.tsx` (linhas 30-34), há uma verificação interna que executa **durante a renderização** antes do `profile` ser carregado pelo `useAuth()`. Como `profile` começa `null`, a condição `!profile` é verdadeira e dispara `navigate('/')` imediatamente — mesmo para admin. O `RoleGuard` externo já valida a permissão corretamente, então essa checagem duplicada está causando o redirect indevido.

Além disso, chamar `navigate()` dentro do corpo do componente (não em `useEffect`) é antipattern e gera warning do React.

## Correção

**`src/pages/StudentAbsences.tsx`** — Remover o bloco de verificação interno (linhas 30-34). O `RoleGuard` no `App.tsx` já garante que apenas `admin`, `secretary`, `instructor`, `tutor` e `coordinator` acessem a rota.

```tsx
// REMOVER:
if (!profile || !['admin', 'secretary', 'coordinator', 'tutor', 'instructor'].includes(profile.role || '')) {
  navigate('/');
  return null;
}
```

Também remover o import não utilizado `useAuth` se não for usado em outro lugar do arquivo (verificar).

## Resultado esperado

Admin (e demais roles autorizados) acessam `/student-absences` normalmente sem redirect.
