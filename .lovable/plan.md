## Problema identificado

Três páginas inicializam o estado local com valores fixos de admin, o que faz a Navigation/Layout exibirem temporariamente (ou de forma persistente, dependendo da velocidade de carregamento do perfil) o menu e o nome "Admin" para instrutores e alunos:

- `src/pages/Attendance.tsx` — `useState<UserRole>('admin')` e `useState('Admin')`
- `src/pages/Communications.tsx` — mesmo padrão
- `src/pages/StudentDashboard.tsx` — mesmo padrão

Como o `Layout` faz `displayRole = profile?.role || userRole`, enquanto o profile não termina de carregar (ou em um flash de renderização) o `userRole='admin'` vence e o menu de admin aparece. O `Navigation` então monta os grupos do admin (Gestão de Aulas → Frequência etc.), confundindo o usuário.

## Correção (apenas frontend/apresentação)

1. **`src/pages/Attendance.tsx`**
   - Remover `useState<UserRole>('admin')` e `useState('Admin')`.
   - Derivar `userRole` e `userName` diretamente de `profile` (ex.: `const userRole = (profile?.role ?? undefined) as UserRole | undefined;` e `const userName = profile?.name ?? '';`).
   - Enquanto `userRole` for `undefined`, renderizar um loader curto (ou simplesmente deixar o `Layout` cuidar do estado de loading — ele já trata `!displayRole`).
   - Manter toda a lógica condicional existente (`userRole === 'student'`, `userRole === 'instructor'`) intacta.

2. **`src/pages/Communications.tsx`** — mesma alteração: remover defaults de admin e derivar do `profile`.

3. **`src/pages/StudentDashboard.tsx`** — mesma alteração.

4. **(Opcional, defensivo) `src/components/layout/Layout.tsx`**
   - Quando `profile` ainda está carregando mas `userRole` foi passado por prop, **não** usar o prop como fallback se ele puder estar incorreto. Como agora as páginas não passarão mais um default fixo, o comportamento atual (`profile?.role || userRole`) já fica seguro — nenhuma mudança obrigatória aqui.

Nenhuma alteração de regra de negócio, RLS, banco ou rotas. Apenas remoção de defaults incorretos para que a Navigation reflita sempre o papel real do usuário autenticado.

## Resultado esperado

Instrutor e aluno, ao acessar `/attendance` (ou qualquer outra das páginas acima), veem imediatamente o menu correspondente ao seu papel — sem flash do menu admin e sem o rótulo "Admin" no cabeçalho do usuário.