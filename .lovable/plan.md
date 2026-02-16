

## Corrigir erro "PGRST203" na pagina de Registro de Frequencia

### Problema

O erro `PGRST203` ocorre porque existem duas versoes da funcao `get_attendance_with_details` no banco de dados:
1. Uma sem parametros (`Args: never`)
2. Uma com parametros opcionais (`p_class_id, p_subject_id, p_start_date, p_end_date, p_limit`)

Quando nenhum filtro e aplicado, o objeto `rpcParams` fica vazio (`{}`), e o PostgREST nao consegue decidir qual versao chamar.

### Solucao

**Arquivo: `src/hooks/useSupabaseAttendance.ts`** (linhas 59-76)

Sempre enviar todos os parametros na chamada RPC, usando `null` para os que nao foram preenchidos. Isso forca o PostgREST a usar a versao com parametros, eliminando a ambiguidade.

```typescript
// Sempre incluir todos os parametros para evitar ambiguidade PGRST203
const rpcParams: Record<string, any> = {
  p_class_id: null,
  p_subject_id: null,
  p_start_date: null,
  p_end_date: null,
  p_limit: 5000
};

if (activeFilters?.class_id && activeFilters.class_id !== 'all') {
  rpcParams.p_class_id = activeFilters.class_id;
}
if (activeFilters?.subject_id && activeFilters.subject_id !== 'all') {
  rpcParams.p_subject_id = activeFilters.subject_id;
}
if (activeFilters?.start_date) {
  rpcParams.p_start_date = activeFilters.start_date;
}
if (activeFilters?.end_date) {
  rpcParams.p_end_date = activeFilters.end_date;
}
```

### Arquivo alterado
- `src/hooks/useSupabaseAttendance.ts`

