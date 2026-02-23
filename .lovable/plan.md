

# Adicionar Campo "Data de Nascimento" ao Fluxo de Selecionados

## Resumo

Seguindo o mesmo padrao do CPF: o campo "Data de Nascimento" sera opcional no cadastro administrativo, mas obrigatorio quando o aluno confirmar sua inscricao pelo link.

## Alteracoes

### 1. Banco de Dados
- Adicionar coluna `birth_date` (tipo `date`, nullable) na tabela `selected_students`:
  ```sql
  ALTER TABLE public.selected_students ADD COLUMN birth_date date;
  ```

### 2. Hook (`src/hooks/useSelectedStudents.ts`)
- Adicionar `birth_date: string | null` na interface `SelectedStudent`
- Adicionar `birth_date?: string` na interface `CreateSelectedStudentInput`
- Incluir `birth_date: input.birth_date || null` nos inserts (individual e lote)

### 3. Formulario Individual (`src/components/forms/SelectedStudentForm.tsx`)
- Adicionar campo `birth_date` ao schema Zod como opcional: `birth_date: z.string().optional().or(z.literal(''))`
- Adicionar Input do tipo `date` no formulario (campo HTML nativo, como ja usado em outros formularios do projeto)

### 4. Formulario em Lote (`src/components/forms/BatchSelectedStudentsForm.tsx`)
- Adicionar coluna "Nasc." na tabela com Input tipo `date`
- Incluir `birth_date` na interface Row e na funcao `emptyRow()`
- Sem validacao obrigatoria; se preenchido, sera salvo

### 5. Pagina de Confirmacao (`src/pages/ConfirmEnrollment.tsx`)
- Adicionar `birth_date` na interface `StudentData`
- Adicionar estado `birthDateValue` (pre-preenchido se existir)
- Se vazio: exibir Input tipo `date` editavel para o aluno preencher
- Se ja preenchido: exibir como texto somente leitura (formatado DD/MM/AAAA)
- Validar que a data de nascimento foi informada antes de permitir confirmacao
- Enviar `birth_date` no body do POST

### 6. Edge Function (`supabase/functions/confirm-enrollment/index.ts`)
- No GET: incluir `birth_date` no select e na resposta
- No POST de confirmacao: aceitar `birth_date` no body, validar formato (YYYY-MM-DD), salvar no update
- No POST de desistencia: nao precisa de alteracao

## Secao Tecnica

### Migracao SQL
```sql
ALTER TABLE public.selected_students ADD COLUMN birth_date date;
```

### Logica na pagina de confirmacao
```typescript
const [birthDateValue, setBirthDateValue] = useState('');
// Ao carregar: if (result.birth_date) setBirthDateValue(result.birth_date);

// No formulario: se vazio, Input type="date" editavel
// No submit: body inclui birth_date: birthDateValue
```

### Validacao na Edge Function (POST confirmacao)
```typescript
const birth_date = body.birth_date;
if (!birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
  return error 400 'Data de nascimento obrigatoria';
}
// Incluir no update: birth_date
```

### Botao de confirmar - desabilitado se CPF ou data de nascimento invalidos
```typescript
disabled={!shift || confirming || !cpfRegex.test(cpfValue) || !birthDateValue}
```

