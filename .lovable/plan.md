## Problema

O instrutor não consegue lançar frequência. O fluxo atual faz `INSERT` direto na tabela `attendance` e depende da política RLS:

```
Instructors can insert and update attendance for their subjects
WITH CHECK: get_user_role(auth.uid()) = 'instructor'
            AND subject_id IN (SELECT s.id FROM subjects s
                               WHERE s.teacher_id = auth.uid()
                                  OR s.name IN (SELECT unnest(instructor_subjects) FROM profiles WHERE id = auth.uid()))
```

A política em si está correta (e os instrutores têm `subjects.teacher_id` apontando para eles), porém na prática o `INSERT` em lote está sendo bloqueado/silenciado e o toast genérico ("Erro ao registrar frequência") esconde a mensagem real do Postgres. Possíveis causas:

1. O `try/catch` em `Attendance.tsx` engole o erro do Supabase (não loga `error.message`).
2. Triggers de auditoria (`audit_table_changes`) e/ou o re-fetch após o insert (`fetchAttendance` → `get_attendance_with_details`) podem retornar erro e abortar o fluxo, fazendo parecer que o insert falhou.
3. RLS via subquery em `profiles` pode falhar para alguns instrutores cujas disciplinas estão ligadas só por `instructor_subjects` (texto) e não por `teacher_id`.

## Solução

Criar um caminho server-side robusto via RPC `SECURITY DEFINER` que valida e insere a frequência em lote, contornando ambiguidades de RLS, com mensagens de erro claras.

### 1. Migração — função RPC `instructor_insert_attendance_batch`

Função `SECURITY DEFINER` que:
- Valida que `auth.uid()` tem role `instructor`, `admin` ou `secretary`.
- Para cada registro, valida que o `subject_id` pertence ao instrutor (via `instructor_can_access_subject`) — admin/secretary passam direto.
- Faz `INSERT` em lote em `public.attendance` com `daily_activity`.
- Retorna a contagem de inseridos. Lança `RAISE EXCEPTION` com mensagem amigável em PT-BR caso a validação falhe.

### 2. Frontend — `src/hooks/useSupabaseAttendance.ts`

Em `createBatchAttendance`, quando role for `instructor`, chamar `supabase.rpc('instructor_insert_attendance_batch', { p_records: [...], p_daily_activity })` em vez de `.from('attendance').insert(...)`. Para admin/secretary mantém o insert direto (já funciona).

### 3. Frontend — `src/pages/Attendance.tsx` (handleAttendanceSubmit)

Substituir o toast genérico por um que exiba `error.message` real, para nunca mais ocultar o motivo:

```ts
catch (error: any) {
  console.error('❌ Erro ao registrar frequência:', error);
  toast({
    variant: "destructive",
    title: "Erro ao registrar frequência",
    description: error?.message || "Ocorreu um erro ao salvar a frequência.",
  });
}
```

### 4. Mesma melhoria de mensagem em `src/pages/InstructorSubjects.tsx`

O caminho via "Disciplinas" também usa `createAttendance` direto. Atualizar para usar o mesmo RPC (consistência) e exibir erro real.

## Detalhes técnicos

- O RPC remove a dependência da subquery de RLS por linha (mais rápido em lote e elimina edge cases).
- Mantém a tabela `attendance` com RLS atual intacta — o RPC, sendo `SECURITY DEFINER`, executa as inserções, mas a validação de permissão é replicada no corpo da função.
- A função usa `SET search_path = public` e validação explícita de role para evitar elevação de privilégio.
- Triggers de auditoria continuam funcionando normalmente (capturam o `auth.uid()` do chamador).

## Arquivos afetados

- Nova migração SQL com `instructor_insert_attendance_batch(p_records jsonb, p_daily_activity text)`.
- `src/hooks/useSupabaseAttendance.ts` — roteia insert do instrutor para o RPC.
- `src/pages/Attendance.tsx` — log + toast com erro real.
- `src/pages/InstructorSubjects.tsx` — mesma melhoria.

## Fora de escopo

- Não altera políticas RLS existentes.
- Não altera fluxo de admin/secretária (continua via insert direto).
- Não toca em grades, equipamentos ou outras áreas.
