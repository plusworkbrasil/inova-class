## Objetivo

Criar uma tela administrativa que liste todos os usuários atualmente bloqueados (profiles.status = 'blocked'), mostre detalhes do bloqueio (motivo, rotas tentadas, número e data da última tentativa, dados do usuário) e permita o desbloqueio com um clique, reaproveitando a RPC `unblock_user(p_user_id)` já existente.

## Mudanças

### 1. `src/pages/BlockedUsers.tsx` (novo)
Página exclusiva para admin (`RoleGuard allowedRoles={['admin']}`).

- **Carregamento**: 
  - Busca em `profiles` todos com `status = 'blocked'` (id, name, email, role, phone, class_id, updated_at).
  - Para cada usuário, busca em `unauthorized_access_attempts` as tentativas (rota, role na época, attempted_at) ordenadas por `attempted_at desc`.
  - Opcionalmente, busca o último log `ACCOUNT_AUTO_BLOCKED` em `audit_logs` para exibir quando o bloqueio aconteceu e os campos registrados.
- **Cabeçalho**: título "Usuários Bloqueados" + descrição curta + cards de resumo (Total bloqueados, Bloqueados nas últimas 24h, Total de tentativas registradas).
- **Lista**: tabela com colunas Nome, E-mail, Perfil, Última tentativa, Nº tentativas, Ações.
  - Botão "Detalhes" abre `Dialog` com:
    - Dados do usuário (nome, e-mail, perfil, turma se aluno, telefone).
    - Linha do tempo das tentativas: rota, role na época, data/hora.
    - Motivo do bloqueio: "Bloqueio automático após 3+ tentativas de acesso a rota restrita em 5 minutos" + lista das rotas tentadas.
    - Botão "Desbloquear usuário" (com confirmação) que chama `supabase.rpc('unblock_user', { p_user_id })` e remove da lista.
  - Botão direto "Desbloquear" na linha (com `AlertDialog` de confirmação).
- **Filtros**: campo de busca por nome/e-mail e filtro de perfil.
- **Empty state**: mensagem amigável "Nenhum usuário bloqueado no momento".

### 2. `src/App.tsx`
- Importar `BlockedUsers`.
- Adicionar rota `<Route path="/usuarios-bloqueados" element={<RoleGuard allowedRoles={['admin']}><BlockedUsers /></RoleGuard>} />`.

### 3. `src/components/layout/Navigation.tsx`
- No grupo **Gestão Administrativa** do admin (linhas 50-60), adicionar:
  `{ icon: ShieldAlert, label: 'Usuários Bloqueados', path: '/usuarios-bloqueados' }`
  (importar `ShieldAlert` de `lucide-react`).

## Backend / RLS
Sem mudanças necessárias:
- `unblock_user` (SECURITY DEFINER) já valida `has_role(auth.uid(), 'admin')`.
- `profiles` já permite SELECT por admin.
- `unauthorized_access_attempts` e `audit_logs` já têm policy de SELECT para admin.

## Fora do escopo
- Sem alterações no fluxo de bloqueio automático (`record_unauthorized_access_attempt`).
- Sem mudanças na página `/users` (filtro "Bloqueado por tentativa" continua disponível lá).
