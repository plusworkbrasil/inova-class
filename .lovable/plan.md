

# Tornar CPF Opcional no Cadastro e Obrigatorio na Confirmacao

## Resumo

O CPF passara a ser opcional no cadastro administrativo (individual e em lote), mas sera obrigatorio quando o aluno acessar o link de confirmacao. Se o CPF nao estiver preenchido, o aluno precisara informa-lo antes de confirmar.

## Alteracoes

### 1. Formulario Individual (`src/components/forms/SelectedStudentForm.tsx`)
- Remover a validacao regex obrigatoria do campo `cpf` no schema Zod
- Tornar o campo opcional: `cpf: z.string().trim().regex(cpfRegex).optional().or(z.literal(''))`
- Manter a mascara de formatacao funcionando normalmente

### 2. Formulario em Lote (`src/components/forms/BatchSelectedStudentsForm.tsx`)
- Remover a validacao obrigatoria de CPF na funcao `validate()`
- Se CPF estiver preenchido, validar o formato; se vazio, aceitar normalmente

### 3. Hook (`src/hooks/useSelectedStudents.ts`)
- Alterar a interface `CreateSelectedStudentInput` para `cpf?: string` (opcional)
- Ajustar o insert para enviar `cpf: input.cpf || null`

### 4. Banco de Dados
- Migrar a coluna `cpf` da tabela `selected_students` para aceitar NULL:
  ```sql
  ALTER TABLE public.selected_students ALTER COLUMN cpf DROP NOT NULL;
  ```

### 5. Pagina de Confirmacao (`src/pages/ConfirmEnrollment.tsx`)
- Adicionar estado para `cpfValue` (pre-preenchido com o CPF existente ou vazio)
- Se o CPF estiver vazio (nao foi informado no cadastro), exibir um campo Input para o aluno digitar com mascara de formatacao
- Se o CPF ja existir, exibir como texto (somente leitura), como ja funciona hoje
- Validar que o CPF esta no formato correto (000.000.000-00) antes de permitir a confirmacao
- Enviar o `cpf` no body do POST de confirmacao

### 6. Edge Function (`supabase/functions/confirm-enrollment/index.ts`)
- No handler POST de confirmacao, aceitar o campo `cpf` no body
- Validar o formato do CPF recebido (regex)
- Ao atualizar o status para `confirmed`, tambem salvar o CPF informado pelo aluno na coluna `cpf`

## Secao Tecnica

### Schema Zod atualizado (SelectedStudentForm)
```typescript
cpf: z.string().trim()
  .refine(val => !val || cpfRegex.test(val), { message: 'CPF deve estar no formato 000.000.000-00' })
  .optional()
  .or(z.literal(''))
```

### Logica na pagina de confirmacao
```typescript
const [cpfValue, setCpfValue] = useState('');
// Ao carregar dados:
if (result.cpf) setCpfValue(result.cpf);

// No formulario: se cpf vazio, mostrar Input editavel
// No submit: incluir cpf no body
body: JSON.stringify({ confirmed_shift: shift, cpf: cpfValue })
```

### Validacao na Edge Function
```typescript
const cpf = body.cpf;
if (!cpf || !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
  return new Response(JSON.stringify({ error: 'CPF obrigatorio no formato 000.000.000-00' }), { status: 400 });
}
// Incluir no update:
.update({ status: 'confirmed', confirmed_shift, cpf, confirmed_at: ..., token_used_at: ... })
```

