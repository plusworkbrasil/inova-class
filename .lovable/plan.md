

## Corrigir datas na exportacao PDF e Excel

### Problema
A funcao `formatDate` em `src/lib/attendanceExport.ts` (linha 28-34) usa `new Date(dateStr)` para converter strings "YYYY-MM-DD". O JavaScript interpreta esse formato como UTC meia-noite, e no fuso horario do Brasil (UTC-3) a data recua 1 dia.

Exemplo: "2024-12-09" vira 8 de dezembro as 21h no Brasil.

### Solucao

**Arquivo: `src/lib/attendanceExport.ts`**

Alterar a funcao `formatDate` (linhas 28-34) para usar parsing manual com `split('-')`, igual ao que ja foi feito no dialog:

```
De:
  return format(new Date(dateStr), formatStr, { locale: ptBR });

Para:
  const [year, month, day] = dateStr.split('-').map(Number);
  return format(new Date(year, month - 1, day), formatStr, { locale: ptBR });
```

Isso cria a data usando o construtor local (ano, mes, dia), evitando a interpretacao UTC.

### Arquivo alterado
- `src/lib/attendanceExport.ts` (1 alteracao na funcao formatDate, linha 30)

