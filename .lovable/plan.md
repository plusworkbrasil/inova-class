
# Adicionar Botoes de Evasao para o Tutor

## Resumo

O tutor ja tem acesso a pagina de evasoes e as politicas RLS do banco ja permitem que tutores criem e visualizem evasoes. Porem, os botoes de acao (Registrar Evasao, Editar e Cancelar) estao ocultos para o role "tutor" na interface. A alteracao e simples: incluir `'tutor'` nas verificacoes de role que controlam a exibicao desses botoes.

## Alteracoes

### 1. Botao "Registrar Evasao" (linha 274)
- Adicionar `userRole === 'tutor'` na condicao que exibe o botao de criar evasao
- De: `admin || secretary || instructor`
- Para: `admin || secretary || instructor || tutor`

### 2. Coluna "Acoes" no cabecalho da tabela (linha 523)
- Adicionar `userRole === 'tutor'` na condicao
- De: `admin || secretary`
- Para: `admin || secretary || tutor`

### 3. Botoes de acao por linha (Editar e Cancelar) (linha 542)
- Adicionar `userRole === 'tutor'` na condicao que exibe os botoes Editar e Cancelar Evasao
- De: `admin || secretary`
- Para: `admin || secretary || tutor`

## Secao Tecnica

Todas as alteracoes sao no arquivo `src/pages/Evasions.tsx`:

```text
Linha 274: (userRole === 'admin' || userRole === 'secretary' || userRole === 'instructor' || userRole === 'tutor')
Linha 523: (userRole === 'admin' || userRole === 'secretary' || userRole === 'tutor')
Linha 542: (userRole === 'admin' || userRole === 'secretary' || userRole === 'tutor')
```

Nao e necessaria nenhuma alteracao no banco de dados, pois as politicas RLS ja permitem que tutores facam INSERT e UPDATE em evasoes que eles mesmos criaram (`reported_by = auth.uid()`), e SELECT em todas as evasoes.

**Observacao sobre cancelamento:** O cancelamento de evasao atualiza tanto a tabela `evasions` quanto `profiles`. A RLS de `evasions` permite que tutores atualizem evasoes que eles mesmos criaram. Ja a RLS de `profiles` permite update apenas para admins/secretarias ou o proprio usuario. Portanto, o tutor so conseguira cancelar evasoes que **ele proprio registrou**, e o update do perfil do aluno pode falhar se o tutor nao for admin/secretary. Se necessario, posso ajustar para restringir o botao de cancelar apenas para admin/secretary, mantendo o botao de editar para o tutor.
