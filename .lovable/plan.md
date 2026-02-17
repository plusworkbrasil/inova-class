

## Tornar a tabela de frequencia compacta e responsiva para caber na tela

### Problema
Mesmo com o dialog em 100% da largura, a tabela tem celulas, paddings e min-widths grandes demais para exibir todos os dados sem scroll horizontal.

### Solucao

**Arquivo: `src/components/ui/subject-attendance-matrix-dialog.tsx`**

#### 1. Reduzir tamanho das celulas de status (renderCell, linhas 93 e 101)
- Altura das celulas: `h-10` -> `h-6`
- Adicionar `text-xs` para texto menor

#### 2. Compactar cabecalho da tabela (linhas 254-267)
- Coluna "Aluno": `min-w-[200px] px-4 py-3` -> `min-w-[120px] px-2 py-1.5 text-xs`
- Colunas de datas: `min-w-[60px] px-3 py-3 text-sm` -> `min-w-[36px] px-1 py-1.5 text-[10px]`
- Coluna "% Presenca": `min-w-[100px] px-4 py-3` -> `min-w-[60px] px-1 py-1.5 text-xs`

#### 3. Compactar celulas do corpo da tabela (linhas 280-312)
- Celula do nome do aluno: `px-4 py-2` -> `px-2 py-1`
- Nome: adicionar `text-xs` e `truncate max-w-[120px]`
- Celulas de data: `px-2 py-2` -> `px-0.5 py-1`
- Celula de porcentagem: `px-4 py-2` -> `px-1 py-1`
- Badge de porcentagem: adicionar `text-[10px] px-1.5 py-0`

#### 4. Compactar cards de resumo (linhas 217-244)
- Icones: `h-8 w-8` -> `h-6 w-6`
- Valores: `text-2xl` -> `text-lg`
- Gap e padding: `gap-3 p-3` -> `gap-2 p-2`

#### 5. Compactar legenda (linhas 326-346)
- Quadrados: `w-8 h-8` -> `w-6 h-6`
- Texto: `text-sm` -> `text-xs`
- Gap: `gap-4` -> `gap-3`

### Resultado esperado
A tabela inteira ficara significativamente mais compacta, permitindo visualizar mais colunas de datas sem precisar de scroll horizontal. Em telas grandes, todas as informacoes devem caber sem scroll.

### Arquivo alterado
- `src/components/ui/subject-attendance-matrix-dialog.tsx` (alteracoes em ~15 locais)
