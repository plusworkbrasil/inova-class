## Objetivo

Permitir que **qualquer usuário** (admin, coordinator, secretary, instructor, tutor, student) edite seus próprios dados de **telefone, data de nascimento e e-mail**, além de **adicionar/atualizar/remover a foto de perfil**, através de um ícone de engrenagem (⚙) sempre visível e fácil de achar.

## Onde colocar o ícone de engrenagem

Adicionar um botão de engrenagem (`Settings`) no bloco "User Info" da `Navigation.tsx` (sidebar), ao lado do nome/avatar do usuário. Visível para **todas as roles**, em desktop e mobile. Ao clicar, abre o diálogo de configurações pessoais.

## Componente: `MyProfileSettingsDialog` (novo, genérico)

Criar `src/components/forms/MyProfileSettingsDialog.tsx` baseado no `StudentProfileSettingsForm` existente, porém:

- Disponível para qualquer role (não só estudante).
- Seções: **Foto de Perfil**, **Telefone**, **Data de Nascimento**, **E-mail**, **Segurança (alterar senha)**.
- **Foto**: usar o componente existente `AvatarUpload` (já suporta upload, troca e remoção via bucket `avatars`). Após salvar, chamar `update profiles.avatar` e atualizar o contexto `useAuth`.
- **Telefone / Data de Nascimento**: update direto em `profiles` via Supabase (RLS já permite o próprio usuário).
- **E-mail**: usar `supabase.auth.updateUser({ email })`. O Supabase enviará e-mail de confirmação ao novo endereço; até a confirmação, o e-mail antigo permanece. Mostrar mensagem clara ao usuário ("Confirme em sua nova caixa de entrada"). O campo `profiles.email` será sincronizado automaticamente após confirmação por uma função/trigger leve (ver Detalhes técnicos).
- Validação com `zod`: telefone (formato BR), data (não futura), e-mail válido.

## Substituir o uso atual

`StudentDashboard.tsx` e `Profile.tsx` hoje abrem `StudentProfileSettingsForm`. Trocar para o novo `MyProfileSettingsDialog` (mantém compatibilidade) e remover/depreciar o antigo.

## Detalhes técnicos

1. **Sincronização de e-mail**: a tabela `profiles` tem trigger `protect_profile_admin_fields` que bloqueia mudança de `email` por não-admin. Para manter `profiles.email` igual ao `auth.users.email` após o usuário confirmar o novo e-mail, criar trigger em `auth.users` AFTER UPDATE OF email que sincroniza `profiles.email` (SECURITY DEFINER, contornando o trigger de proteção via flag de sessão ou via `UPDATE` direto que ignora o gatilho — alternativa: ajustar `protect_profile_admin_fields` para permitir quando `NEW.email = (SELECT email FROM auth.users WHERE id = NEW.id)`).

2. **Avatar**: a coluna usada hoje é `profiles.avatar` (e `photo` em alguns lugares). Padronizar gravando em `avatar`. O bucket `avatars` já existe e é público; políticas de storage já permitem upload pelo próprio usuário.

3. **Refresh do contexto**: após salvar, chamar `refetch` do `useAuth` para que o avatar/nome novos apareçam imediatamente na sidebar.

## Fora de escopo

- Edição de outros campos sensíveis (CPF, RG, endereço completo, etc.).
- Edição de e-mail de outros usuários (continua restrita a admin/secretary via edge function existente).