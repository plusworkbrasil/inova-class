## Problema

Admin não consegue acessar `/subject-grades` ("Notas por Disciplina") — vê "Acesso Negado".

**Causa raiz:** Em `src/pages/SubjectGrades.tsx` (linhas 37-53), há uma verificação interna `canManageGrades = ['admin', 'secretary'].includes(userRole)` que executa **durante a renderização inicial** antes do `profile` ser carregado pelo `useAuth()`. Como `profile` começa `null`, `userRole` recebe o fallback `'student'` (linha 37: `(profile?.role || 'student')`), e a tela "Acesso Negado" é renderizada imediatamente — mesmo para admin.

O `RoleGuard` externo em `App.tsx` já valida corretamente (`[...ADMIN, 'instructor']`), tornando essa checagem duplicada redundante e bugada.

Mesmo padrão da correção feita em `StudentAbsences.tsx`.

## Correção

**`src/pages/SubjectGrades.tsx`** — Remover o bloco de verificação interno (linhas 49-61):

```tsx
// REMOVER:
const canManageGrades = ['admin', 'secretary'].includes(userRole);

if (!canManageGrades) {
  return (
    <Layout ...>
      <div>Acesso Negado</div>
    </Layout>
  );
}
```

O `RoleGuard` no `App.tsx` já garante que apenas `admin`, `secretary` e `instructor` acessem a rota.

## Resultado esperado

Admin (e demais roles autorizados) acessam `/subject-grades` normalmente sem ver "Acesso Negado".
