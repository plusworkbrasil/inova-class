

# Plano: Corrigir data dos aniversariantes exibida um dia antes

## Problema
`new Date("YYYY-MM-DD")` interpreta a data como UTC meia-noite. No fuso de Brasília (UTC-3), isso resulta no dia anterior (ex: `2026-04-17` vira `16 de abr`).

## Solução
Usar parsing manual com `split('-')` para criar a data no fuso local, conforme já aplicado em outros pontos do sistema.

## Alterações em `src/components/dashboard/BirthdayCard.tsx`

Trocar todas as ocorrências de `new Date(person.birth_date)` e `new Date(dateString)` pelo parsing manual:

**Linha 64** — no `fetchBirthdayPeople`:
```typescript
// De:
const birthDate = new Date(person.birth_date);
// Para:
const [y, m, d] = person.birth_date.split('-').map(Number);
const birthDate = new Date(currentYear, m - 1, d);
```
E remover a linha 65 (`thisYearBirthday`) pois `birthDate` já estará no ano correto.

**Linha 106** — no `formatBirthday`:
```typescript
// De:
const date = new Date(dateString);
// Para:
const [y, m, d] = dateString.split('-').map(Number);
const date = new Date(y, m - 1, d);
```

Mesma correção padrão já utilizada no restante do sistema (Matriz de Frequência, exportações PDF/Excel).

