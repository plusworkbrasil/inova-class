

## Plano: Corrigir Visibilidade dos Alunos Mateus e Matheus nas Disciplinas

### Problema Identificado

Os alunos **Mateus de Jesus Miranda** e **Matheus Antônio Andrade Chagas** não aparecem nas listas porque:

1. **Possuem evasões ativas** registradas em 11/11/2025 (motivo: "Dificuldades acadêmicas")
2. **Não possuem nenhuma presença "C"** nas disciplinas Computação em Nuvens e Projetos

| Aluno | ID | Evasão ID |
|-------|-----|-----------|
| Mateus de Jesus Miranda | `64396819-79d6-4cbe-9ffd-c277c4fb000b` | `4b5caba3-d28e-4663-a880-28f4bf26fa47` |
| Matheus Antônio Andrade Chagas | `3da048a8-cc5a-4d4b-95cd-f72dc6d4e326` | `dbdff59a-bb7c-4bd3-81f4-15046692e806` |

---

### Solução: Cancelar Evasões via SQL

Executar uma migration para cancelar as evasões registradas por engano:

```sql
-- Cancelar evasões ativas dos alunos Mateus e Matheus
UPDATE evasions 
SET 
  status = 'cancelled',
  observations = COALESCE(observations, '') || 
    E'\n[Cancelado em ' || to_char(now(), 'DD/MM/YYYY') || 
    ']: Evasão registrada por engano - aluno retornou às aulas.',
  updated_at = now()
WHERE id IN (
  '4b5caba3-d28e-4663-a880-28f4bf26fa47',  -- Mateus de Jesus Miranda
  'dbdff59a-bb7c-4bd3-81f4-15046692e806'   -- Matheus Antônio Andrade Chagas
);
```

---

### Sobre as Presenças

Após cancelar as evasões, os alunos aparecerão:

- ✅ Na **lista de chamada** (para registrar frequência)
- ⚠️ Na **matriz de frequência** - somente após terem ao menos 1 presença "C" registrada
- ⚠️ Na **lista de notas** - somente após terem ao menos 1 presença "C" registrada
- ⚠️ Nos **PDFs de Lista de Presença/Frequência** - somente após terem ao menos 1 presença "C"

Isso ocorre porque a regra de negócio implementada anteriormente exige que o aluno tenha comparecido ao menos uma vez para aparecer nas matrizes consolidadas.

---

### Alternativa: Via Interface

Caso prefira não usar SQL, você pode:

1. Ir em **Gestão de Evasões** (`/evasions`)
2. Localizar os registros de Mateus Miranda e Matheus Antônio
3. Clicar no botão **"Cancelar Evasão"** para cada um

---

### Resultado Esperado

| Etapa | Antes | Depois |
|-------|-------|--------|
| Cancelar evasões | Evasões ativas bloqueando | Evasões canceladas |
| Aparecer na chamada | ❌ Não aparecem | ✅ Aparecerão |
| Registrar presença "C" | -- | Instrutor registra |
| Aparecer em frequência/notas | ❌ | ✅ Após 1ª presença |

