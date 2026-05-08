# Integração com Resend

Você escolheu usar o **Resend** (em vez do sistema de e-mails nativo do Lovable). Vamos conectar via o conector oficial — sem precisar colar API key manualmente.

## Pré-requisitos (você faz no Resend)

1. **Verificar o domínio `inovaclass.online`** no painel do Resend → Domains → Add Domain.
2. O Resend vai te dar 3 registros DNS (SPF, DKIM, MX/Return-Path) para adicionar no seu provedor de domínio.
3. Após verificado, o remetente `no-reply@inovaclass.online` fica liberado.

> Enquanto o domínio não estiver verificado, todo envio será feito de `onboarding@resend.dev` (modo teste, só envia para o e-mail dono da conta Resend) — bom para validar o fluxo antes do DNS propagar.

## Conexão do Resend ao projeto

Vou abrir o seletor do conector Resend — você só clica para autorizar a sua conta. As credenciais ficam guardadas em segurança e disponíveis como variáveis de ambiente nas Edge Functions automaticamente.

## Edge Function única: `send-email-resend`

Crio uma Edge Function genérica que recebe:
- `to` (email do destinatário)
- `subject`
- `html` (corpo já montado)
- `attachments` (opcional, para PDFs em base64)

Ela faz a chamada via gateway do Lovable (`connector-gateway.lovable.dev/resend/emails`) com validação Zod, autenticação JWT do usuário chamador e tratamento de erros padronizado.

## Templates de e-mail (HTML inline, com identidade InovaClass)

Crio um helper `src/lib/email-templates.ts` com 3 templates branded (cores e logo do sistema):

1. **`justificationStatusEmail`** — Resultado da justificativa de falta (aprovada/rejeitada), com motivo, data da falta e disciplina.
2. **`classCommunicationEmail`** — Mesmo conteúdo do comunicado WhatsApp, formatado em HTML com nome da turma e remetente.
3. **`declarationDeliveryEmail`** — Texto curto + PDF da declaração anexado (base64).

## Pontos de integração no app

### 1. Justificativas de falta
- **Onde**: componente que aprova/rejeita justificativa (`src/components/.../JustificationReview*` ou similar — vou localizar exatamente na implementação).
- **Quando**: ao mudar status para `approved` ou `rejected`.
- **Para quem**: e-mail do aluno (`profiles.email`).
- **Comportamento**: dispara em paralelo à notificação atual; falha de e-mail NÃO bloqueia a aprovação (log silencioso + toast informativo).

### 2. Comunicados de turma
- **Onde**: `ClassCommunication` / fluxo de envio em massa.
- **Quando**: junto com o disparo do WhatsApp, como **canal complementar opcional** — adiciono um checkbox "Enviar também por e-mail" no formulário de envio.
- **Para quem**: todos os alunos ativos da turma com `email` preenchido.
- **Anti-spam**: respeitar o mesmo padrão de delay 5–8s entre envios (mantém a regra global do projeto).
- **Tracking**: registrar status de envio na tabela já existente de tracking de comunicados (estender colunas se necessário, ex.: `email_sent_at`, `email_status`).

### 3. Declarações em PDF
- **Onde**: tela de emissão de declaração do aluno (admin/secretaria).
- **Quando**: depois de gerar o PDF, oferecer botão **"Enviar por e-mail"** ao lado de "Baixar".
- **Para quem**: e-mail do aluno destinatário da declaração.
- **Como**: PDF é convertido para base64 no frontend e mandado como anexo via Edge Function.

## Tabela de log (nova)

`email_send_log`:
- `id`, `recipient_email`, `subject`, `template_type` (`justification` | `communication` | `declaration`), `reference_id` (id da justificativa/comunicado/declaração), `status` (`sent` | `failed`), `error_message`, `sent_by` (uuid), `sent_at`.
- RLS: admin/secretaria leem tudo; instrutor lê só os próprios; alunos não acessam.

Serve para auditoria, retentativa manual e dashboard futuro.

## Detalhes técnicos

- **Gateway URL**: `https://connector-gateway.lovable.dev/resend/emails`
- **Headers**: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${RESEND_API_KEY}`
- **Validação**: Zod no body da Edge Function
- **Auth**: validar JWT do chamador na Edge Function (papéis admin/secretary/instructor)
- **From**: `"InovaClass <no-reply@inovaclass.online>"` (com fallback `onboarding@resend.dev` se domínio ainda não verificado — controlado por flag de ambiente)
- **Reply-To**: e-mail institucional configurável (default: o próprio `no-reply`)

## O que NÃO entra agora

- Newsletters / e-mail marketing (Resend bloqueia mistura com transacional, prejudica reputação)
- Webhooks de bounce/complaint (pode ser feito numa segunda fase se houver demanda)
- Editor de templates pelo admin (templates ficam no código)

## Ordem de execução

1. Conectar o Resend (você autoriza no popup)
2. Criar tabela `email_send_log` + RLS (migration)
3. Criar Edge Function `send-email-resend`
4. Criar helper de templates HTML
5. Integrar em justificativas, comunicados e declarações (com checkbox no comunicado)
6. Testar no preview com `onboarding@resend.dev` primeiro

Posso seguir?
