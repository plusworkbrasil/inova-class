

# Editar Template da Mensagem WhatsApp Antes de Enviar

## Resumo

Adicionar um campo de texto editavel no dialog de envio de WhatsApp, permitindo que o admin personalize a mensagem antes de disparar. O template vem pre-preenchido com a mensagem padrao e suporta variaveis dinamicas (`{nome}` e `{link}`) que serao substituidas por aluno.

## Alteracoes

### 1. Frontend: `src/components/ui/whatsapp-invite-dialog.tsx`

- Adicionar estado `messageTemplate` inicializado com o template padrao
- Inserir um `Textarea` editavel entre a selecao de modo e os botoes, visivel no modo `choose`
- Mostrar legenda explicando as variaveis disponiveis: `{nome}` = nome do aluno, `{link}` = link de confirmacao
- Passar o template customizado para a edge function no body da requisicao (`custom_message`)
- Usar o mesmo template no envio manual (wa.me), substituindo as variaveis no frontend

### 2. Edge Function: `supabase/functions/send-whatsapp-invites/index.ts`

- Aceitar campo opcional `custom_message` no body da requisicao
- Se `custom_message` estiver presente, usar como template substituindo `{nome}` pelo nome do aluno e `{link}` pelo link de confirmacao
- Se nao estiver presente, manter a mensagem padrao atual
- Validar que o template contem `{link}` (obrigatorio para o convite funcionar)

### Detalhes Tecnicos

**Template padrao (pre-preenchido no Textarea):**
```
Ola {nome}!

Parabens! Voce foi selecionado(a) para o nosso curso!

Para confirmar sua pre-matricula, acesse o link abaixo e preencha seus dados:

{link}

Este link e pessoal e intransferivel. Valido por 48 horas.

Equipe Inova Class
```

**Variaveis suportadas:**
- `{nome}` - substituido pelo `full_name` do aluno
- `{link}` - substituido pelo link de confirmacao de matricula

**Validacao:**
- O template deve conter `{link}` obrigatoriamente; caso contrario, exibir alerta e bloquear envio
- Limite maximo de 1000 caracteres no template

