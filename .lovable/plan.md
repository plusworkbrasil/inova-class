## Objetivo

Criar um "modo manutenção" que bloqueia o acesso de **todos os usuários** ao sistema, exibindo a mensagem **"Procure o administrador do sistema"**. O bloqueio age tanto no login quanto dentro do app (deslogando sessões ativas). Admin liga/desliga via toggle em **Configurações**.

> Observação importante: como o usuário pediu "todos sem exceção", para que seja possível **desligar** o bloqueio sem mexer no banco, o admin mantém acesso **apenas à página `/configuracoes`** quando o modo está ligado. Todas as demais rotas (inclusive Dashboard) mostram a tela de bloqueio, inclusive para admins. Essa é a única exceção e está restrita ao toggle.

## Como vai funcionar

1. Admin entra em **Configurações → Manutenção** e ativa o switch "Bloquear acesso ao sistema".
2. Todos os usuários logados (qualquer role) são imediatamente redirecionados para uma tela de bloqueio com a mensagem **"Sistema temporariamente indisponível — Procure o administrador do sistema"** e botão "Sair".
3. Novas tentativas de login (qualquer role) são bloqueadas com a mesma mensagem.
4. Admin continua conseguindo abrir `/configuracoes` para desligar o switch a qualquer momento.
5. Ao desligar o switch, tudo volta ao normal automaticamente (sem precisar reiniciar nada).

## Implementação técnica

### Banco (`system_settings`)

A tabela `system_settings` já existe. Adicionar (idempotente via UPSERT no app) uma chave:
- `key = 'maintenance_mode'`, `value = { enabled: boolean, updated_by: uuid, updated_at: timestamp }`.

Criar função SECURITY DEFINER `is_maintenance_mode()` que retorna `boolean` lendo essa linha — chamável por `anon` e `authenticated` (sem precisar autenticação) para que o login possa consultar antes de autenticar.

RLS de `system_settings`:
- SELECT da linha `maintenance_mode` liberado para `anon` e `authenticated` (ou usamos a função para encapsular).
- UPDATE/INSERT apenas para admin (já existe política do tipo; confirmar e ajustar se necessário).

Trigger/log: registrar em `audit_logs` (`MAINTENANCE_ENABLED` / `MAINTENANCE_DISABLED`) com `user_id = auth.uid()`.

### Frontend

**Novo hook `useMaintenanceMode`** (em `src/hooks/useMaintenanceMode.ts`):
- Faz `select` inicial em `system_settings` (key=`maintenance_mode`).
- Assina canal realtime (`postgres_changes` na linha) para reagir em tempo real.
- Expõe `{ enabled, loading, toggle(value) }`.

**Nova página `MaintenanceLock`** (`src/pages/MaintenanceLock.tsx`):
- Card centralizado com ícone de cadeado, título "Sistema temporariamente indisponível", mensagem "Procure o administrador do sistema", e botão **Sair** que chama `logout()`.
- Usa tokens do design system (sem cores hardcoded).

**Gating global** em `src/components/layout/Layout.tsx`:
- Após verificar `isAuthenticated`, ler `useMaintenanceMode()`.
- Se `enabled === true` e a rota atual **não** for `/configuracoes` com usuário admin, renderizar `<MaintenanceLock />` no lugar de `children`.
- Admin em `/configuracoes` continua vendo o painel normal (mas apenas a aba de Manutenção é estritamente necessária).

**Bloqueio no login** em `src/hooks/useSupabaseAuth.ts` (`login`):
- Após `signInWithPassword` bem-sucedido, consultar `supabase.rpc('is_maintenance_mode')`.
- Se `true`: deslogar imediatamente (`auth.signOut()`) e lançar erro com a mensagem "Sistema temporariamente indisponível. Procure o administrador do sistema." — o toast de erro já existente exibirá a mensagem.

**Aviso na tela de login** em `src/pages/Auth.tsx`:
- Consultar `is_maintenance_mode` ao montar; se ligado, exibir um `Alert` destacado acima do formulário com a mesma mensagem (mantém o formulário desativado).

### Configurações (`src/pages/Settings.tsx`)

Adicionar um novo card/aba **"Manutenção"** (visível apenas para admin) contendo:
- Switch "Bloquear acesso ao sistema (modo manutenção)".
- Texto explicativo: "Quando ligado, todos os usuários — inclusive administradores — só veem a tela de bloqueio. Você continua tendo acesso a esta página para desligar."
- Confirmação (`AlertDialog`) antes de ligar, alertando que vai deslogar todo mundo.
- Ao alternar: chama `useMaintenanceMode.toggle()` que faz UPDATE/UPSERT em `system_settings`.

### Edge functions (opcional, mas recomendado)

Para reforçar no servidor, adicionar verificação `is_maintenance_mode` no início das funções sensíveis (`create-user`, `update-user-password`, `send-class-communication`, `request-password-reset`, etc.) — se ligado, retornar 503 com a mensagem padrão. Fica fora do escopo desta primeira entrega caso o usuário prefira só o bloqueio de UI; nesse caso, anotamos como melhoria futura. **Decisão padrão: incluir nesta entrega para `create-user`, `update-user-password`, `request-password-reset` e `reset-password-with-token`** (as mais sensíveis).

## Fora de escopo

- Bloqueio por role específico ou por janela de horário.
- Página pública informativa fora do app autenticado (a mensagem já aparece tanto em `/auth` quanto após login).
- Notificação por e-mail/WhatsApp aos usuários sobre a manutenção.

## Validação

1. Ativar o switch como admin → confirmar que outra aba/usuário (qualquer role) é redirecionado para a tela de bloqueio em segundos (realtime).
2. Deslogar e tentar entrar com aluno/instrutor → bloqueado, com a mensagem.
3. Admin abre `/configuracoes` → consegue acessar e desligar o switch.
4. Desligar → todos voltam a navegar normalmente sem refresh manual.
