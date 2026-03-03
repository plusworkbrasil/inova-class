

# Plano: Criar Página de Documentação do Sistema em PDF

## Objetivo
Criar uma página `/documentacao` que gera um PDF completo com a documentação do sistema Inova Class, descrevendo todas as funcionalidades, módulos, perfis de acesso e fluxos.

## Abordagem
Criar um componente React que renderiza a documentação completa do sistema em HTML formatado e usa a biblioteca `html2pdf.js` (já instalada) para gerar o PDF ao clicar em um botão.

## Estrutura do Documento PDF

O PDF conterá as seguintes seções:

1. **Capa** — Logo, nome "Inova Class - Sistema de Gestão Escolar", versão, data
2. **Índice**
3. **Visão Geral do Sistema** — Descrição, tecnologias, arquitetura
4. **Perfis de Acesso** — Admin, Secretaria, Coordenador, Tutor, Instrutor, Aluno — com permissões de cada um
5. **Módulos do Sistema**:
   - Dashboard (personalizado por perfil)
   - Gestão de Usuários
   - Gestão de Turmas
   - Gestão de Disciplinas
   - Frequência (registro, justificativas, alertas)
   - Notas (por disciplina, por instrutor)
   - Evasões (registro, relatório, exportação PDF/Excel)
   - Declarações (solicitação, workflow de aprovação)
   - Comunicações (avisos, comunicado por turma via WhatsApp)
   - Equipamentos (alocação, incidentes, histórico)
   - Relatórios (frequência, notas, distribuição, alunos faltosos)
   - Histórico do Aluno
   - Alunos em Risco (scoring, intervenções)
   - Alunos Selecionados (matrícula, convites)
   - Segurança (monitoramento, auditoria)
   - Configurações
6. **Integrações** — Supabase, WhatsApp (WaSender), agendamento com pg_cron
7. **Segurança** — RLS, autenticação, roles

## Implementação Técnica

1. **Criar `src/pages/SystemDocumentation.tsx`** — Página com o conteúdo da documentação e botão "Baixar PDF"
2. **Adicionar rota `/documentacao`** em `App.tsx`
3. **Adicionar link no menu** de admin em `Navigation.tsx` (dentro de Gestão Administrativa)
4. **Usar `html2pdf.js`** para conversão, com configurações de margem, paginação e cabeçalho

A documentação será gerada dinamicamente a partir de conteúdo estático descrevendo cada módulo com base na estrutura real do sistema.

