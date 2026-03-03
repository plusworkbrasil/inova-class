

# Plano: Proteger `/documentacao` com senha

## O que será feito
Adicionar um estado de autenticação local na página `SystemDocumentation.tsx`. Ao acessar, o usuário verá um formulário pedindo a senha. Só após digitar "inova2026" o conteúdo será exibido.

## Implementação

1. **Editar `src/pages/SystemDocumentation.tsx`**:
   - Adicionar estado `isUnlocked` (boolean, default `false`) e `password` (string)
   - Antes de renderizar o conteúdo da documentação, mostrar um card centralizado com input de senha e botão "Acessar"
   - Ao submeter, comparar com `"inova2026"`. Se correto, `setIsUnlocked(true)`. Se errado, mostrar toast de erro
   - O conteúdo da documentação só renderiza quando `isUnlocked === true`
   - A senha fica armazenada apenas em memória (recarregar a página pede novamente)

Nenhuma alteração de banco de dados ou rotas necessária.

