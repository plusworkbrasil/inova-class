
## Corrigir overflow do dialog "Ver Frequencia"

### Problema
O conteudo do dialog (cards de resumo + tabela) ultrapassa os limites do dialog porque:
1. O container do body (`div.px-6.pb-6` na linha 180) nao tem controle de overflow
2. Os cards de resumo em grid nao estao contidos dentro da largura do dialog
3. Apenas a tabela tem ScrollArea, mas todo o body precisa de scroll vertical

### Solucao

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

1. **Linha 180**: Adicionar `overflow-y-auto` e limitar a altura do body para permitir scroll vertical de todo o conteudo (cards + tabela + legenda):
   ```
   <div className="px-4 sm:px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
   ```

2. **Linha 216**: Garantir que o grid de cards nao ultrapasse a largura, adicionando `overflow-hidden`:
   ```
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden">
   ```

3. **Linha 249**: Adicionar `ScrollBar` horizontal explicito ao ScrollArea da tabela para garantir rolagem horizontal visivel:
   ```
   <ScrollArea className="h-[400px] w-full border rounded-lg">
     <div className="min-w-max">
       ...tabela...
     </div>
     <ScrollBar orientation="horizontal" />
   </ScrollArea>
   ```
   E adicionar `ScrollBar` ao import.

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx`
