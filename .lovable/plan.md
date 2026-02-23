

# Modulo de Selecionados - Sistema de Pre-Matricula com Convite via WhatsApp

## Resumo

Criar um modulo completo de pre-matricula ("Selecionados") onde o admin cadastra alunos aprovados em lote, envia convites via WhatsApp com link tokenizado, e o aluno confirma seus dados e turno. Apos confirmacao, o admin pode atribuir alunos confirmados a turmas, efetivando o cadastro no sistema.

## Fluxo Completo

```text
FASE 1 - CADASTRO DE SELECIONADOS (Admin)
  Admin acessa /selected-students
  Cadastra alunos um a um ou em lote (nome, telefone, email, CPF)
  Sistema valida email duplicado contra profiles e selected_students
  Aluno fica com status "pending"

FASE 2 - CONVITE VIA WHATSAPP (Admin)
  Admin seleciona alunos e clica "Enviar Convite WhatsApp"
  Sistema gera token unico (UUID) para cada aluno
  Abre link do WhatsApp (wa.me) com mensagem pre-formatada contendo o link
  Link: https://inovaclass2000.lovable.app/confirm-enrollment/{token}
  Status muda para "invited"

FASE 3 - CONFIRMACAO PELO ALUNO (Publico)
  Aluno clica no link e acessa pagina publica (sem login)
  Sistema valida o token e exibe dados pre-preenchidos
  Aluno confirma nome, email, CPF e seleciona turno (manha/tarde/noite)
  Status muda para "confirmed"
  Token e invalidado (uso unico)

FASE 4 - ATRIBUICAO A TURMA (Admin)
  Admin visualiza lista de "Confirmados" com filtros por turno, busca por nome/email/telefone
  Seleciona alunos e atribui a uma turma
  Sistema cria o usuario no Supabase Auth (via edge function existente invite-student)
  Aluno e cadastrado na turma automaticamente
  Status muda para "enrolled"
```

## Banco de Dados

### Nova tabela: `selected_students`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| full_name | text (NOT NULL) | Nome completo |
| email | text (NOT NULL, UNIQUE) | Email do aluno |
| phone | text (NOT NULL) | Telefone |
| cpf | text (NOT NULL) | CPF com validacao |
| shift | text | Turno selecionado pelo admin (manha/tarde/noite) |
| confirmed_shift | text | Turno confirmado pelo aluno |
| status | text (NOT NULL) | pending, invited, confirmed, enrolled |
| invite_token | uuid (UNIQUE) | Token unico para o link de confirmacao |
| token_expires_at | timestamptz | Expiracao do token (48h) |
| token_used_at | timestamptz | Quando o token foi usado |
| confirmed_at | timestamptz | Data da confirmacao |
| enrolled_at | timestamptz | Data da matricula efetiva |
| enrolled_user_id | uuid | ID do usuario criado no sistema |
| created_by | uuid (NOT NULL) | Admin que cadastrou |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### Politicas RLS
- Admin e secretary: ALL (gerenciamento completo)
- Acesso publico via token: feito exclusivamente pela edge function (service role)

## Arquivos a Criar

### 1. Pagina principal: `src/pages/SelectedStudents.tsx`
- Abas: "Selecionados" | "Confirmados" | "Matriculados"
- Aba Selecionados: tabela com alunos pending/invited, botao cadastrar, botao enviar WhatsApp
- Aba Confirmados: tabela com filtro por turno e busca por nome/email/telefone, botao "Atribuir a Turma"
- Aba Matriculados: historico de alunos ja efetivados

### 2. Formulario de cadastro: `src/components/forms/SelectedStudentForm.tsx`
- Dialog com campos: nome completo, telefone, email, CPF, turno do curso
- Validacao com zod (CPF formato, email valido, telefone)
- Verificacao de email duplicado (contra `profiles` e `selected_students`)
- Suporte a cadastro individual

### 3. Formulario de cadastro em lote: `src/components/forms/BatchSelectedStudentsForm.tsx`
- Dialog com tabela editavel para inserir multiplos alunos de uma vez
- Botao "Adicionar linha" para novos registros
- Validacao em lote antes de salvar
- Feedback visual de erros por linha

### 4. Pagina publica de confirmacao: `src/pages/ConfirmEnrollment.tsx`
- Rota publica `/confirm-enrollment/:token` (sem necessidade de login)
- Valida token via edge function
- Exibe dados pre-preenchidos (nome, email, CPF)
- Campo para selecionar turno (manha, tarde, noite)
- Botao confirmar que atualiza status e invalida token
- Mensagens de erro para token invalido/expirado/ja usado

### 5. Dialog de envio WhatsApp: `src/components/ui/whatsapp-invite-dialog.tsx`
- Seleciona alunos da lista
- Gera tokens unicos para cada aluno selecionado
- Para cada aluno, abre `https://wa.me/{telefone}?text={mensagem}` com link de confirmacao
- Mensagem template configuravel

### 6. Dialog de atribuicao a turma: `src/components/ui/assign-class-dialog.tsx`
- Seleciona turma destino
- Lista alunos confirmados selecionados
- Ao confirmar: chama edge function para criar usuario e atribuir turma
- Atualiza status para "enrolled"

### 7. Hook: `src/hooks/useSelectedStudents.ts`
- CRUD completo para tabela `selected_students`
- Funcoes: listar, criar, criar em lote, atualizar status, gerar tokens, buscar por token

### 8. Edge function: `supabase/functions/confirm-enrollment/index.ts`
- Endpoint publico (verify_jwt = false)
- GET com token: retorna dados do aluno (para pre-preencher formulario)
- POST com token + dados confirmados: atualiza status, salva turno confirmado, invalida token
- Validacoes: token existe, nao expirou, nao foi usado

### 9. Edge function: `supabase/functions/enroll-selected-student/index.ts`
- Endpoint autenticado (admin/secretary)
- Recebe ID do selected_student + class_id
- Cria usuario no Supabase Auth (email + senha temporaria)
- Cria perfil com dados do selecionado
- Insere role "student" em user_roles
- Atualiza selected_students com enrolled_user_id e status "enrolled"
- Retorna senha temporaria para o admin compartilhar

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|----------|
| `src/App.tsx` | Adicionar rotas `/selected-students` e `/confirm-enrollment/:token` |
| `src/components/layout/Navigation.tsx` | Adicionar "Selecionados" no menu admin e secretary |
| `supabase/config.toml` | Adicionar config das novas edge functions |

## Seguranca

- Tokens sao UUIDs v4 criptograficamente aleatorios
- Tokens expiram em 48 horas
- Tokens sao de uso unico (invalidados apos confirmacao)
- A pagina de confirmacao nao exige login, mas o token vincula univocamente ao aluno
- A criacao de usuario no Auth so ocorre via edge function autenticada (admin/secretary)
- Verificacao de email duplicado previne cadastros conflitantes
- RLS restringe acesso a tabela selected_students a admin/secretary

## Validacoes

- CPF: formato `000.000.000-00` (regex)
- Email: formato valido + unicidade contra profiles e selected_students
- Telefone: minimo 10 digitos
- Nome: minimo 2 caracteres, maximo 100
- Token: UUID valido, nao expirado, nao utilizado

