

# Corrigir Evasao de Alunos pelo Tutor

## Problema

O tutor consegue ver os botoes de evasao na interface (correcao anterior), mas ao tentar registrar ou cancelar uma evasao, a operacao falha silenciosamente. Isso acontece porque o fluxo de evasao atualiza o campo `status` na tabela `profiles` do aluno (para "inactive" ao registrar, e para "active" ao cancelar), e a politica RLS de UPDATE na tabela `profiles` so permite que o proprio usuario ou admin/secretary facam essa atualizacao. O tutor nao tem permissao para alterar o perfil de outro usuario.

## Solucao

Criar uma funcao de banco de dados com `SECURITY DEFINER` que atualiza o status do perfil do aluno de forma segura, verificando internamente se o usuario que chama a funcao tem permissao (admin, secretary ou tutor). Depois, alterar o hook `useSupabaseEvasions.ts` para usar essa funcao em vez de fazer o UPDATE direto na tabela `profiles`.

## Alteracoes

### 1. Migracao SQL - Criar funcao `update_student_status_for_evasion`

Criar uma funcao SECURITY DEFINER que:
- Recebe o `student_id` e o novo `status` ("inactive" ou "active")
- Verifica se o usuario autenticado tem role admin, secretary ou tutor
- Atualiza o campo `status` e `updated_at` na tabela `profiles`
- Retorna erro se o usuario nao tiver permissao

```sql
CREATE OR REPLACE FUNCTION public.update_student_status_for_evasion(
  p_student_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que o status e valido
  IF p_new_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Status invalido: %', p_new_status;
  END IF;

  -- Verificar se o usuario tem permissao
  IF get_user_role(auth.uid()) NOT IN ('admin', 'secretary', 'tutor') THEN
    RAISE EXCEPTION 'Sem permissao para alterar status do aluno';
  END IF;

  -- Atualizar o status do perfil
  UPDATE profiles
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_student_id;
END;
$$;
```

### 2. Alterar `src/hooks/useSupabaseEvasions.ts`

Na funcao `createEvasion` (passo 4), substituir o UPDATE direto na tabela `profiles` por uma chamada RPC:

De:
```typescript
const { error: updateError } = await supabase
  .from('profiles')
  .update({ status: 'inactive', updated_at: new Date().toISOString() })
  .eq('id', evasionData.student_id);
```

Para:
```typescript
const { error: updateError } = await supabase
  .rpc('update_student_status_for_evasion', {
    p_student_id: evasionData.student_id,
    p_new_status: 'inactive'
  });
```

Na funcao `cancelEvasion` (passo 3), mesma substituicao:

De:
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .update({ status: 'active', updated_at: new Date().toISOString() })
  .eq('id', studentId);
```

Para:
```typescript
const { error: profileError } = await supabase
  .rpc('update_student_status_for_evasion', {
    p_student_id: studentId,
    p_new_status: 'active'
  });
```

## Secao Tecnica

### Por que SECURITY DEFINER?

A funcao roda com as permissoes do dono (superadmin), ignorando RLS. Porem, dentro da funcao verificamos manualmente se o usuario autenticado (`auth.uid()`) possui um dos roles permitidos. Isso garante seguranca sem precisar abrir a politica de UPDATE de profiles para tutores (o que seria excessivo).

### Arquivos alterados

1. Nova migracao SQL (funcao `update_student_status_for_evasion`)
2. `src/hooks/useSupabaseEvasions.ts` - duas substituicoes de UPDATE direto por chamada RPC

### Nenhuma alteracao na interface

Os botoes ja estao visiveis para o tutor (correcao anterior). A unica mudanca e no backend/hook para que a operacao realmente funcione.
