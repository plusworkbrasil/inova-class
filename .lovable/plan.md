

## Corrigir overflow horizontal do dialog "Ver Frequencia"

### Problema
A tabela de frequencia transborda horizontalmente alem do dialog. Apesar de existir um `ScrollArea` com `ScrollBar horizontal`, o Radix ScrollArea nao esta contendo o conteudo corretamente porque:
1. O `ScrollArea` usa `w-full` mas nao tem uma largura maxima explicita que o force a respeitar os limites do dialog
2. O `div.min-w-max` dentro do ScrollArea forca a tabela a expandir sem limites

### Solucao

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

1. **Linha 249**: Trocar `w-full` por `w-full overflow-hidden` no ScrollArea para garantir que o container nao se expanda alem do dialog:
   ```
   <ScrollArea className="h-[400px] w-full overflow-hidden border rounded-lg">
   ```

2. **Linha 180**: Adicionar `overflow-x-hidden` ao container principal do body para impedir que qualquer conteudo horizontal extravase:
   ```
   <div className="px-4 sm:px-6 pb-6 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(90vh - 140px)' }}>
   ```

3. **Linha 131**: Garantir que o `DialogContent` tenha `w-[95vw]` em vez de apenas `max-w-[95vw]` para forcar uma largura explicita que o ScrollArea herde corretamente:
   ```
   <DialogContent className="w-[95vw] xl:w-auto xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden">
   ```

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx`
