

# Integracao WaSenderAPI - Envio Automatico em Massa via WhatsApp

## Resumo

Integrar a WaSenderAPI (https://wasenderapi.com) para enviar convites de pre-matricula automaticamente para todos os alunos selecionados com um unico clique, substituindo o fluxo manual de abrir wa.me um por um.

## Pre-requisitos (Sua responsabilidade)

1. Criar conta em https://wasenderapi.com
2. Criar uma sessao WhatsApp (escanear QR code para vincular seu numero)
3. Gerar API Key na dashboard da WaSenderAPI
4. Informar a API Key quando solicitado pelo Lovable (sera armazenada como Supabase Secret)

## API da WaSenderAPI

Endpoint unico para envio de mensagem de texto:

```text
POST https://www.wasenderapi.com/api/send-message
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json
Body:
  {
    "to": "5511999999999",
    "text": "Mensagem aqui"
  }
```

## Alteracoes no Banco de Dados

Adicionar 3 colunas na tabela `selected_students`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| whatsapp_sent_at | timestamptz | Data/hora do envio |
| whatsapp_message_id | text | ID da mensagem retornado pela API |
| whatsapp_status | text | null, sending, sent, failed |

## Arquivos a Criar

### 1. Edge Function: `supabase/functions/send-whatsapp-invites/index.ts`

- Endpoint autenticado (admin/secretary)
- Recebe array de student IDs
- Para cada aluno:
  - Gera token de convite se nao tiver
  - Formata telefone com codigo +55
  - Monta mensagem com link de confirmacao
  - Chama `POST https://www.wasenderapi.com/api/send-message` com Bearer token
  - Atualiza `whatsapp_sent_at`, `whatsapp_message_id`, `whatsapp_status` e `status` para "invited"
- Retorna resumo: total enviados, falhas, detalhes por aluno
- Secret necessario: `WASENDER_API_KEY`

## Arquivos a Modificar

### `src/components/ui/whatsapp-invite-dialog.tsx`

- Adicionar botao "Enviar para Todos Automaticamente" que chama a edge function
- Manter botao manual (wa.me) como fallback para cada aluno
- Exibir barra de progresso durante o envio
- Mostrar resultado final: quantos enviados com sucesso, quantos falharam
- Indicador visual por aluno (icone de check verde = enviado, X vermelho = falhou)

### `src/pages/SelectedStudents.tsx`

- Adicionar coluna "WhatsApp" na tabela mostrando icone de status (enviado/nao enviado)
- Badge indicando se ja recebeu convite via WhatsApp

### `supabase/config.toml`

- Registrar `send-whatsapp-invites` com `verify_jwt = false` (autenticacao feita no codigo)

## Fluxo do Envio em Massa

```text
1. Admin seleciona alunos na aba "Selecionados"
2. Clica em "Enviar WhatsApp"
3. Dialog mostra lista com 2 opcoes:
   - "Enviar para Todos Automaticamente" (via WaSenderAPI)
   - Botao individual por aluno (wa.me manual, fallback)
4. Ao clicar "Enviar Automaticamente":
   - Frontend chama edge function com IDs dos alunos
   - Edge function gera tokens + envia mensagens via API
   - Frontend exibe progresso e resultado
5. Tabela atualiza com status de envio
```

## Seguranca

- API Key armazenada como Supabase Secret (nunca exposta ao frontend)
- Edge function valida que o usuario e admin ou secretary antes de enviar
- Mensagens enviadas server-side, sem expor credenciais

## Mensagem Template

```text
Ola {nome}!

Parabens! Voce foi selecionado(a) para o nosso curso!

Para confirmar sua pre-matricula, acesse o link abaixo e preencha seus dados:

{link}

Este link e pessoal e intransferivel. Valido por 48 horas.

Equipe Inova Class
```

