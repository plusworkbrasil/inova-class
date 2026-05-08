## Objetivo

Permitir que admin/secretaria valide (aprovar/rejeitar) os documentos de justificativa de falta enviados pelos alunos (atestado médico, declaração de trabalho etc.) diretamente pelo sistema, sem precisar de e-mail. Acesso via menu **Gestão de Aulas → Validar Justificativas**.

## O que já existe (reaproveitar)

- Tabela `declarations` com `file_path`, `status`, `student_id`, `type`, `delivery_date`.
- Bucket `declarations` no Storage com upload feito pelo aluno.
- Aluno já envia justificativa com anexo via `StudentDeclarationForm`.
- Página `/declarations` já tem lógica de aprovar/rejeitar e atualizar automaticamente a frequência (`attendance.justification`) quando aprovada.
- Notificação in-app + e-mail para o aluno após mudança de status.

O que falta é uma **página focada** (sem o ruído de outras solicitações) e com acesso claro no menu.

## Plano

### 1. Nova página `src/pages/AbsenceJustifications.tsx`
Página somente para admin/secretaria/coordenador focada em justificativas de falta com anexo:

- **Filtros pré-aplicados**: apenas `declarations` cujo `type` indica justificativa de falta (atestado médico/trabalho) e que tenham `file_path` preenchido.
- **Filtros do usuário**: status (Pendente/Aprovada/Rejeitada), busca por nome do aluno, intervalo de datas da falta.
- **Cards de resumo**: Total, Pendentes, Aprovadas, Rejeitadas.
- **Tabela**: Aluno, Tipo, Data da falta (`delivery_date`), Enviado em, Status, Ações.
- **Ações por linha**:
  - **Visualizar documento** — abre o arquivo do bucket `declarations` em nova aba (URL assinada).
  - **Aprovar** — muda status para `approved`, registra `processed_by`/`processed_at`, e dispara a atualização automática do `attendance.justification` para a data da falta (lógica já existente em `Declarations.tsx`).
  - **Rejeitar** — abre dialog para informar motivo (gravado em `observations`), muda status para `rejected`.
  - Em ambos os casos: dispara notificação in-app + e-mail ao aluno (helpers já existentes).
- **Paginação** de 10 itens, estados de loading/vazio.

### 2. Rota em `src/App.tsx`
- Adicionar `/validar-justificativas` com `RoleGuard allowedRoles={['admin','secretary','coordinator']}`.

### 3. Menu em `src/components/layout/Navigation.tsx`
- Adicionar item **"Validar Justificativas"** (ícone `FileCheck`) dentro do grupo **Gestão de Aulas** para `admin`, `coordinator` e no menu plano de `secretary`.

### 4. Backend
Nenhuma migration necessária. RLS de `declarations` e do bucket `declarations` já permite admin/secretary visualizar e atualizar.

## Fora de escopo

- Mudanças no fluxo do aluno (já funciona).
- Não remover a página `/declarations` existente — ela continua para as demais solicitações (declaração de matrícula etc.).
- Sem alterações no esquema do banco.
