## Problema

Ao enviar uma justificativa de falta em `/declarations` como Aluno, o banco rejeita com:

> new row for relation "declarations" violates check constraint "declarations_type_check"

A constraint atual só aceita dois valores:

```
type IN ('medical_certificate', 'enrollment_certificate')
```

Mas o formulário `StudentDeclarationForm.tsx` envia: `atestado_medico`, `atestado_trabalho` ou `outros`.

## Correção

Atualizar a check constraint `declarations_type_check` para aceitar também os três tipos de justificativa do aluno, mantendo os já existentes (não quebra dados antigos).

### Migração

```sql
ALTER TABLE public.declarations DROP CONSTRAINT declarations_type_check;
ALTER TABLE public.declarations ADD CONSTRAINT declarations_type_check
  CHECK (type IN (
    'medical_certificate',
    'enrollment_certificate',
    'atestado_medico',
    'atestado_trabalho',
    'outros'
  ));
```

### Sem mudanças de código

Os valores enviados pelo form já batem com os novos aceitos. Nenhum outro arquivo usa esses literais (verificado via grep), então não há impacto em listas, filtros ou exports.

## Fora do escopo

- Renomear/normalizar tipos antigos (`medical_certificate`/`enrollment_certificate`).
- Alterar UI do formulário do aluno.
- Mexer em RLS (a INSERT policy já permite o aluno; o erro era exclusivamente da constraint).
