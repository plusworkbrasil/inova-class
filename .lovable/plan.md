

## Corrigir dialog de "Ver Frequencia" que ultrapassa a tela

### Problema
O dialog de frequencia usa `max-w-6xl` (72rem/1152px) que excede a largura da viewport em telas menores, cortando o botao de fechar e os botoes de exportacao no lado direito.

### Solucao

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

1. **Linha 131**: Adicionar constraint de viewport ao DialogContent:
   - De: `max-w-6xl max-h-[90vh] p-0`
   - Para: `max-w-[95vw] xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden`

2. **Linhas 133-177 (Header)**: Tornar o header responsivo para que os botoes de exportacao nao sejam cortados em telas menores:
   - Alterar layout dos botoes de exportacao para empilhar em telas pequenas (`flex-col sm:flex-row`)
   - Mover os botoes para baixo do titulo em telas menores

3. **Linha 249 (ScrollArea)**: Garantir que a area de scroll ocupe o espaco disponivel corretamente.

### Alteracoes especificas

**DialogContent (linha 131)**:
```
<DialogContent className="max-w-[95vw] xl:max-w-6xl max-h-[90vh] p-0 overflow-hidden">
```

**Header layout (linhas 133-177)**: Reestruturar para ser responsivo:
- Titulo e info na primeira linha
- Botoes de exportacao abaixo em telas pequenas, ao lado em telas grandes

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx`
