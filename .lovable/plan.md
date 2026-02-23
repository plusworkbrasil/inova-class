

# Adicionar Filtros em Todas as Abas da Pagina de Selecionados

## Situacao Atual

Atualmente, apenas a aba "Confirmados" possui filtros (busca por texto e filtro por turno). As demais abas (Selecionados, Matriculados, Desistentes) nao possuem nenhum filtro.

## Alteracoes

### Arquivo: `src/pages/SelectedStudents.tsx`

**1. Unificar filtros para todas as abas**

Adicionar uma barra de filtros global (acima ou dentro de cada aba) com os seguintes campos:

- **Busca por texto** (Input com icone de lupa): filtra por nome, e-mail, telefone ou CPF
- **Filtro por Curso** (Select): lista dinamica dos cursos existentes nos dados + opcao "Todos os cursos"
- **Filtro por Turno** (Select): Manha / Tarde / Noite / Todos os turnos
- **Filtro por Status WhatsApp** (Select, apenas nas abas Selecionados/Confirmados): Todos / Enviado / Falhou / Pendente

**2. Logica de filtragem**

- Criar um unico `useMemo` por aba (ou reutilizar a funcao de filtro) que aplica os filtros de texto, curso e turno sobre a lista da aba correspondente
- Os filtros de texto e curso serao compartilhados entre as abas; ao trocar de aba, os filtros permanecem ativos
- Resetar pagina ao alterar qualquer filtro (preparacao para paginacao futura)

**3. Obtencao dinamica da lista de cursos**

- Extrair a lista unica de cursos a partir de `students` com `useMemo`:
  ```
  const courses = useMemo(() =>
    [...new Set(students.map(s => s.course_name).filter(Boolean))],
    [students]
  );
  ```

**4. Novos estados**

- `courseFilter` (string, default `'all'`)
- `whatsappFilter` (string, default `'all'`) -- apenas para abas com coluna WhatsApp

**5. Barra de filtros em cada aba**

Cada aba tera uma barra de filtros consistente acima da tabela contendo:
- Input de busca (nome/email/telefone/CPF)
- Select de Curso
- Select de Turno
- Select de WhatsApp (apenas nas abas Selecionados e Confirmados)
- Os botoes de acao existentes (Cadastrar, Enviar WhatsApp, etc.) permanecem na mesma linha

**6. Funcao de filtragem reutilizavel**

Criar uma funcao `filterStudents(list, { search, courseFilter, shiftFilter, whatsappFilter })` que aplica todos os filtros e e reutilizada em cada aba via `useMemo`.

## Resultado Esperado

Todas as 4 abas (Selecionados, Confirmados, Matriculados, Desistentes) terao filtros por texto, curso e turno. As abas com coluna WhatsApp tambem terao filtro por status do WhatsApp.
