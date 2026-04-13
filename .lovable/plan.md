

# Plano: Adicionar botão de excluir na aba "Confirmados"

## Problema
Na aba "Confirmados" de `/selected-students`, o `renderTable` é chamado com `showActions = false`, o que esconde o botão de exclusão.

## Solução
Alterar a chamada na linha 240 de:
```typescript
{renderTable(filteredConfirmed, true, false)}
```
para:
```typescript
{renderTable(filteredConfirmed, true, true)}
```

Isso ativa a coluna de ações com o botão de lixeira, reutilizando o mesmo `DeleteConfirmation` dialog já existente.

## Arquivo alterado
- `src/pages/SelectedStudents.tsx` — uma única alteração de `false` para `true` na linha 240.

