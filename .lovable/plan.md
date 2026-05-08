# Reset de senha: WhatsApp + E-mail como fallback

## Situação atual
- A função `request-password-reset` envia o link **apenas via WhatsApp** (WaSenderAPI).
- Se o usuário não tem telefone cadastrado, hoje ele simplesmente **não recebe nada** (a tela mostra mensagem genérica por segurança).
- O Resend já está conectado e a função `send-email-resend` já está em produção.

## Objetivo
Garantir que todo usuário com e-mail cadastrado consiga recuperar a senha, mantendo o WhatsApp como canal preferencial.

## Comportamento novo

Ao solicitar "Esqueci minha senha":

1. Busca o perfil pelo e-mail informado.
2. Gera o token de reset (1h de validade, mesmo limite atual de 3 solicitações/hora).
3. **Tenta enviar pelo WhatsApp primeiro** (se o usuário tiver telefone).
   - Sucesso → retorna mensagem informando envio por WhatsApp.
4. **Se não houver telefone OU o WhatsApp falhar** → envia o link por e-mail via Resend.
   - Sucesso → retorna mensagem informando envio por e-mail.
5. Se ambos falharem → erro genérico.
6. Toda tentativa (sucesso/falha, canal usado) é registrada em `email_send_log` quando for por e-mail, e nos logs da edge function quando for WhatsApp.

A resposta ao usuário continua **genérica** (não revela se a conta existe, nem qual canal foi usado em detalhe), apenas indica "verifique seu WhatsApp e/ou e-mail".

## Mudanças técnicas

### 1. Edge Function `request-password-reset`
- Adicionar bloco de fallback após a tentativa de WhatsApp.
- Reutilizar template HTML padrão InovaClass (já existente em `src/lib/email-templates.ts` — replicar inline na função, pois edge functions não importam de `src/`).
- Chamar internamente o Resend (mesmo padrão da função `send-email-resend`: gateway Lovable + `RESEND_API_KEY`).
- Remetente: `InovaClass <no-reply@inovaclass.online>`.
- Assunto: "Redefinição de senha - InovaClass".
- Corpo: saudação + botão/link `https://inovaclass.online/reset-password/{token}` + aviso de validade de 1h.

### 2. Tela `/auth` (Esqueci minha senha)
- Atualizar a mensagem de retorno para refletir os dois canais:
  *"Se o e-mail estiver cadastrado, você receberá o link via WhatsApp e/ou e-mail."*
- Sem mudanças no fluxo do formulário.

### 3. Logging
- Cada envio por e-mail registra em `email_send_log` com `template_type = 'other'` e `reference_id = user_id`.
- Mantém os `console.log` atuais para WhatsApp.

## Não faz parte deste plano
- Mudar o template visual padrão dos e-mails.
- Permitir que o usuário escolha o canal manualmente.
- Alterar o tempo de expiração (segue 1h) ou o rate limit (segue 3/hora).
- Mexer no fluxo de `reset-password-with-token` (a página de definir nova senha continua igual).

## Memória a atualizar
A regra atual em `mem://auth/password-reset-whatsapp` diz que o reset é exclusivo de WhatsApp. Após implementar, atualizar para refletir o novo fallback por e-mail via Resend.
