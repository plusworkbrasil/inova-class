

## Fazer o dialog de frequencia abrir em 100% da largura horizontal

### Problema
O dialog atualmente usa `w-[95vw] xl:w-auto xl:max-w-6xl`, o que limita sua largura e nao ocupa toda a tela horizontalmente.

### Solucao

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

Alterar a classe do `DialogContent` (linha 131) para ocupar 100% da largura da viewport com uma pequena margem:

- De: `w-[95vw] xl:w-auto xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden`
- Para: `w-[calc(100vw-2rem)] max-w-none max-h-[90vh] p-0 overflow-hidden`

Isso faz o dialog ocupar praticamente toda a largura da tela (100vw menos 1rem de margem de cada lado), sem limite maximo de largura.

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx` (1 alteracao na linha 131)
