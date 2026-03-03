import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileDown, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';

const SystemDocumentation = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');

  const handleDownloadPDF = async () => {
    const element = contentRef.current;
    if (!element) return;

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [15, 15, 20, 15],
      filename: 'Inova_Class_Documentacao_Sistema.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'inova2026') {
      setIsUnlocked(true);
    } else {
      toast.error('Senha incorreta');
      setPassword('');
    }
  };

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Lock className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Acesso Restrito</CardTitle>
              <p className="text-sm text-muted-foreground">Digite a senha para acessar a documentação do sistema</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <Button type="submit" className="w-full">Acessar</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Documentação do Sistema</h1>
              <p className="text-muted-foreground">Documentação completa do Inova Class</p>
            </div>
          </div>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>

        <div
          ref={contentRef}
          className="bg-white text-black p-10 rounded-lg shadow-sm max-w-4xl mx-auto"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.7', fontSize: '13px' }}
        >
          {/* CAPA */}
          <div style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '120px', pageBreakAfter: 'always' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a365d', marginBottom: '10px' }}>
              Inova Class
            </h1>
            <h2 style={{ fontSize: '20px', color: '#4a5568', marginBottom: '40px' }}>
              Sistema de Gestão Escolar
            </h2>
            <div style={{ width: '80px', height: '4px', background: '#3182ce', margin: '0 auto 40px' }} />
            <p style={{ fontSize: '16px', color: '#718096' }}>Documentação Completa do Sistema</p>
            <p style={{ fontSize: '14px', color: '#a0aec0', marginTop: '20px' }}>
              Versão 2.0 — {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* ÍNDICE */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SectionTitle>Índice</SectionTitle>
            <ol style={{ paddingLeft: '20px', color: '#2d3748' }}>
              <li style={{ marginBottom: '6px' }}>Visão Geral do Sistema</li>
              <li style={{ marginBottom: '6px' }}>Perfis de Acesso</li>
              <li style={{ marginBottom: '6px' }}>Módulos do Sistema
                <ol style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Dashboard</li>
                  <li>Gestão de Usuários</li>
                  <li>Gestão de Turmas</li>
                  <li>Gestão de Disciplinas</li>
                  <li>Frequência</li>
                  <li>Notas</li>
                  <li>Evasões</li>
                  <li>Declarações</li>
                  <li>Comunicações</li>
                  <li>Equipamentos</li>
                  <li>Relatórios</li>
                  <li>Histórico do Aluno</li>
                  <li>Alunos em Risco</li>
                  <li>Alunos Selecionados</li>
                  <li>Segurança</li>
                  <li>Configurações</li>
                </ol>
              </li>
              <li style={{ marginBottom: '6px' }}>Integrações</li>
              <li style={{ marginBottom: '6px' }}>Segurança e Autenticação</li>
            </ol>
          </div>

          {/* 1. VISÃO GERAL */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SectionTitle>1. Visão Geral do Sistema</SectionTitle>
            <p>
              O <strong>Inova Class</strong> é um sistema completo de gestão escolar desenvolvido para acompanhamento de cursos profissionalizantes.
              O sistema permite o gerenciamento integral de turmas, alunos, instrutores, frequência, notas, evasões, comunicações e equipamentos,
              oferecendo dashboards personalizados para cada perfil de acesso.
            </p>

            <SubTitle>Tecnologias Utilizadas</SubTitle>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS, Vite</li>
              <li><strong>Componentes UI:</strong> shadcn/ui (Radix UI), Lucide Icons, Recharts</li>
              <li><strong>Backend:</strong> Supabase (PostgreSQL, Auth, Edge Functions, Storage, RLS)</li>
              <li><strong>Comunicação:</strong> WaSender API (WhatsApp) com agendamento via pg_cron</li>
              <li><strong>Exportação:</strong> html2pdf.js (PDF), xlsx (Excel)</li>
              <li><strong>Gerenciamento de Estado:</strong> TanStack React Query</li>
            </ul>

            <SubTitle>Arquitetura</SubTitle>
            <p>
              A aplicação segue uma arquitetura SPA (Single Page Application) com comunicação direta ao Supabase.
              As regras de negócio são aplicadas via Row Level Security (RLS) no banco de dados,
              Edge Functions para operações privilegiadas (criação de usuários, envio de comunicados),
              e hooks React customizados para abstração de dados.
            </p>
          </div>

          {/* 2. PERFIS DE ACESSO */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SectionTitle>2. Perfis de Acesso</SectionTitle>
            <p>O sistema possui 6 perfis de acesso com permissões diferenciadas:</p>

            <ProfileSection
              title="Administrador (Admin)"
              permissions={[
                'Acesso total a todos os módulos do sistema',
                'Gerenciamento de usuários (criar, editar, excluir)',
                'Configurações gerais do sistema',
                'Visualização de relatórios completos e dashboards',
                'Gestão de equipamentos, evasões, comunicações',
                'Monitoramento de segurança e auditoria',
                'Gestão de alunos selecionados e matrículas',
              ]}
            />

            <ProfileSection
              title="Secretaria (Secretary)"
              permissions={[
                'Gerenciamento de usuários e turmas',
                'Registro de frequência e notas',
                'Gestão de declarações e evasões',
                'Gestão de equipamentos',
                'Envio de comunicados e avisos',
                'Gestão de alunos selecionados',
                'Acesso a relatórios gerais',
              ]}
            />

            <ProfileSection
              title="Coordenador (Coordinator)"
              permissions={[
                'Visualização de turmas e disciplinas',
                'Acompanhamento de frequência',
                'Monitoramento de evasões',
                'Relatórios e histórico de alunos',
                'Comunicação com turmas via WhatsApp',
                'Visualização de alunos faltosos',
              ]}
            />

            <ProfileSection
              title="Tutor"
              permissions={[
                'Dashboard com estatísticas de acompanhamento',
                'Gestão de turmas e frequência',
                'Registro e cancelamento de evasões',
                'Comunicado por turma via WhatsApp',
                'Relatórios, histórico e alunos faltosos',
                'Monitoramento de alunos em risco com intervenções',
                'Visão de timeline de turmas',
                'Gestão de declarações',
              ]}
            />

            <ProfileSection
              title="Instrutor (Instructor)"
              permissions={[
                'Dashboard personalizado com suas disciplinas',
                'Visualização de disciplinas atribuídas',
                'Registro de frequência para seus alunos',
                'Lançamento de notas por disciplina',
                'Gestão de equipamentos utilizados em aula',
              ]}
            />

            <ProfileSection
              title="Aluno (Student)"
              permissions={[
                'Dashboard personalizado com informações acadêmicas',
                'Visualização do perfil pessoal',
                'Consulta de notas por disciplina',
                'Visualização de frequência',
                'Solicitação de declarações',
              ]}
            />
          </div>

          {/* 3. MÓDULOS */}
          <SectionTitle>3. Módulos do Sistema</SectionTitle>

          {/* 3.1 Dashboard */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.1 Dashboard</SubTitle>
            <p>
              O dashboard é personalizado para cada perfil de acesso, exibindo informações relevantes ao papel do usuário:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Admin:</strong> Estatísticas gerais (total de alunos, turmas, frequência média, evasões), gráficos de desempenho, alertas de evasão e aniversariantes.</li>
              <li><strong>Tutor:</strong> Estatísticas das turmas sob sua responsabilidade, alunos em risco, frequência consolidada, timeline de turmas.</li>
              <li><strong>Coordenador:</strong> Visão geral de turmas, frequência e indicadores de acompanhamento.</li>
              <li><strong>Instrutor:</strong> Suas disciplinas ativas, alunos por turma, frequência e notas das disciplinas.</li>
              <li><strong>Aluno:</strong> Banner pessoal, notas recentes, frequência, notificações, equipamentos alocados.</li>
            </ul>
          </div>

          {/* 3.2 Gestão de Usuários */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.2 Gestão de Usuários</SubTitle>
            <p>Módulo disponível para Admin e Secretaria. Permite:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Criar novos usuários com qualquer perfil (admin, secretaria, coordenador, tutor, instrutor, aluno)</li>
              <li>Editar informações pessoais, endereço, contato de emergência</li>
              <li>Atribuir alunos a turmas</li>
              <li>Visualizar detalhes completos com dados médicos e acadêmicos</li>
              <li>Reset de senhas individual ou em lote</li>
              <li>Exclusão de usuários (com cascata de dados relacionados)</li>
              <li>Upload de foto/avatar</li>
              <li>Diagnóstico e sincronização de e-mails de autenticação</li>
            </ul>
          </div>

          {/* 3.3 Turmas */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.3 Gestão de Turmas</SubTitle>
            <p>Gerenciamento de turmas com:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Criar e editar turmas com nome, ano e tutor responsável</li>
              <li>Visualizar alunos matriculados em cada turma</li>
              <li>Visualizar disciplinas vinculadas à turma</li>
              <li>Contagem automática de alunos por turma</li>
              <li>Filtros e pesquisa rápida</li>
            </ul>
          </div>

          {/* 3.4 Disciplinas */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.4 Gestão de Disciplinas</SubTitle>
            <p>Cadastro e gerenciamento de disciplinas:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Criar disciplinas com nome, código, descrição, carga horária</li>
              <li>Vincular disciplina a uma turma e instrutor</li>
              <li>Definir datas de início e término</li>
              <li>Status da disciplina (ativa, concluída, cancelada)</li>
              <li>Visualização em timeline/Gantt das disciplinas da turma</li>
              <li>Disciplinas urgentes (próximas do término)</li>
            </ul>
          </div>

          {/* 3.5 Frequência */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.5 Frequência</SubTitle>
            <p>Módulo completo de controle de presença:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Registro de presença/falta por data, turma e disciplina</li>
              <li>Campo de atividade diária para registro contextual</li>
              <li>Justificativa de faltas com texto explicativo</li>
              <li>Edição em lote de registros de frequência</li>
              <li>Matriz de frequência por disciplina (visão consolidada)</li>
              <li>Exportação de frequência por disciplina (PDF/Excel)</li>
              <li>Alertas automáticos para alunos com excesso de faltas</li>
              <li>Filtragem por turma, disciplina, data e status</li>
            </ul>
          </div>

          {/* 3.6 Notas */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.6 Notas</SubTitle>
            <p>Sistema de lançamento e acompanhamento de notas:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Lançamento de notas por disciplina com tipo (prova, trabalho, projeto, final)</li>
              <li>Nota com valor e valor máximo configurável</li>
              <li>Lançamento em lote para toda a turma</li>
              <li>Visualização agrupada por turma/disciplina</li>
              <li>Notas do instrutor (apenas suas disciplinas)</li>
              <li>Notas do aluno (consulta pessoal)</li>
              <li>Exportação de notas por disciplina</li>
              <li>Gráficos de evolução de notas</li>
            </ul>
          </div>

          {/* 3.7 Evasões */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.7 Evasões</SubTitle>
            <p>Controle de evasão escolar:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Registrar evasão de aluno com motivo, data e observações</li>
              <li>Altera automaticamente o status do aluno para "inativo"</li>
              <li>Cancelar evasão (reativa o aluno como "ativo")</li>
              <li>Histórico completo de evasões registradas</li>
              <li>Liberação automática de equipamentos alocados ao aluno evadido</li>
              <li>Exportação de relatório de evasões em PDF e Excel</li>
              <li>Disponível para Admin, Secretaria e Tutor</li>
              <li>Função SECURITY DEFINER para atualização segura do status</li>
            </ul>
          </div>

          {/* 3.8 Declarações */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.8 Declarações</SubTitle>
            <p>Workflow de solicitação e aprovação de declarações:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Aluno solicita declaração informando tipo, finalidade e urgência</li>
              <li>Tipos: matrícula, frequência, conclusão, transferência, etc.</li>
              <li>Status: pendente, em processamento, pronta, entregue, recusada</li>
              <li>Secretaria/Tutor processam a solicitação</li>
              <li>Upload de documento finalizado</li>
              <li>Registro de data de entrega e observações</li>
              <li>Notificações automáticas ao aluno sobre status</li>
            </ul>
          </div>

          {/* 3.9 Comunicações */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.9 Comunicações</SubTitle>
            <p>Sistema de comunicação multicanal:</p>

            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Comunicado por Turma (WhatsApp):</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Envio de mensagens via WhatsApp para todos os alunos de uma turma</li>
              <li>Integração com WaSender API</li>
              <li>Envio escalonado (5-8 segundos entre mensagens) para evitar bloqueio por spam</li>
              <li>Agendamento de envio futuro com pg_cron</li>
              <li>Registro de resultados (enviados, falhas, total)</li>
              <li>Histórico de comunicados enviados</li>
            </ul>

            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Avisos Internos:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Publicação de avisos no sistema com prioridade e categoria</li>
              <li>Público-alvo configurável por perfil</li>
              <li>Controle de leitura por usuário</li>
              <li>Data de expiração automática</li>
            </ul>
          </div>

          {/* 3.10 Equipamentos */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.10 Equipamentos</SubTitle>
            <p>Gestão patrimonial de equipamentos:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Cadastro de equipamentos com tipo, marca, modelo, número de série, patrimônio</li>
              <li>Status: disponível, em uso, manutenção, aposentado</li>
              <li>Alocação de equipamentos para alunos com turno e período</li>
              <li>Controle de devolução com data de retorno</li>
              <li>Registro de incidentes (danos, perdas) com severidade e resolução</li>
              <li>Histórico completo de alocações por equipamento</li>
              <li>Pesquisa de alocações por aluno</li>
              <li>Dashboard de estatísticas de equipamentos</li>
              <li>Liberação automática de equipamentos em caso de evasão</li>
            </ul>
          </div>

          {/* 3.11 Relatórios */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.11 Relatórios</SubTitle>
            <p>Módulo de relatórios com múltiplas visões:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Relatório Geral:</strong> Métricas globais, gráficos de frequência, distribuição de notas, desempenho por disciplina</li>
              <li><strong>Alunos Faltosos:</strong> Lista de alunos com excesso de faltas, filtros por turma e período, exportação</li>
              <li><strong>Gráficos:</strong> Evolução de notas, frequência por período, desempenho por disciplina, Gantt de disciplinas</li>
              <li><strong>Exportação:</strong> Relatórios exportáveis em PDF e Excel</li>
            </ul>
          </div>

          {/* 3.12 Histórico do Aluno */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.12 Histórico do Aluno</SubTitle>
            <p>Consulta detalhada do histórico acadêmico individual:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Busca de aluno por nome ou matrícula</li>
              <li>Visualização de dados pessoais, turma e status</li>
              <li>Histórico de frequência com percentuais por disciplina</li>
              <li>Histórico de notas com médias e evolução</li>
              <li>Gráficos individuais de desempenho</li>
              <li>Exportação do histórico completo em PDF</li>
            </ul>
          </div>

          {/* 3.13 Alunos em Risco */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.13 Alunos em Risco</SubTitle>
            <p>Sistema de identificação e acompanhamento de alunos em situação de risco:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Cálculo automático de score de risco baseado em frequência, notas e faltas</li>
              <li>Níveis de risco: baixo, médio, alto, crítico</li>
              <li>Registro manual de alunos em risco pelo tutor</li>
              <li>Sistema de intervenções com tipos (conversa, encaminhamento, reunião familiar, etc.)</li>
              <li>Timeline de intervenções realizadas com resultado e acompanhamento</li>
              <li>Agendamento de follow-up para intervenções</li>
              <li>Status de acompanhamento: ativo, em monitoramento, resolvido</li>
              <li>Dashboard com indicadores de risco por turma</li>
            </ul>
          </div>

          {/* 3.14 Alunos Selecionados */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.14 Alunos Selecionados</SubTitle>
            <p>Módulo de pré-matrícula e gestão de candidatos selecionados:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Cadastro de candidatos selecionados com dados pessoais e contato</li>
              <li>Status: selecionado, convidado, confirmado, matriculado, desistente</li>
              <li>Envio de convites individuais ou em lote via WhatsApp</li>
              <li>Link de confirmação de matrícula com token único e expiração</li>
              <li>Formulário público de confirmação de matrícula com escolha de turno</li>
              <li>Matrícula automática após confirmação (cria usuário no sistema)</li>
              <li>Registro de desistências com motivo</li>
              <li>Filtros por status, turno e curso</li>
            </ul>
          </div>

          {/* 3.15 Segurança */}
          <div style={{ pageBreakAfter: 'always' }}>
            <SubTitle>3.15 Segurança</SubTitle>
            <p>Painel de monitoramento de segurança (Admin):</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Logs de auditoria de todas as operações no sistema</li>
              <li>Métricas de segurança (acessos, ações sensíveis, tentativas falhas)</li>
              <li>Detecção de atividades suspeitas</li>
              <li>Monitoramento de acessos a dados médicos e pessoais</li>
              <li>Filtros por usuário, ação, tabela e período</li>
            </ul>
          </div>

          {/* 3.16 Configurações */}
          <div>
            <SubTitle>3.16 Configurações</SubTitle>
            <p>Configurações do sistema (Admin):</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Configurações de integração com WhatsApp (WaSender API)</li>
              <li>Parâmetros de frequência mínima e alertas</li>
              <li>Configurações de notificações</li>
              <li>Personalização de temas e interface</li>
            </ul>
          </div>

          {/* 4. INTEGRAÇÕES */}
          <div style={{ pageBreakBefore: 'always', pageBreakAfter: 'always' }}>
            <SectionTitle>4. Integrações</SectionTitle>

            <SubTitle>4.1 Supabase</SubTitle>
            <p>O sistema utiliza o Supabase como backend completo:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>PostgreSQL:</strong> Banco de dados relacional com todas as tabelas do sistema</li>
              <li><strong>Auth:</strong> Autenticação de usuários com e-mail e senha</li>
              <li><strong>Edge Functions:</strong> Funções serverless para operações privilegiadas (criar usuários, enviar WhatsApp, reset de senhas)</li>
              <li><strong>Storage:</strong> Armazenamento de arquivos (fotos, declarações)</li>
              <li><strong>RLS:</strong> Row Level Security para controle de acesso granular em cada tabela</li>
              <li><strong>Realtime:</strong> Atualizações em tempo real para notificações</li>
            </ul>

            <SubTitle>4.2 WhatsApp (WaSender)</SubTitle>
            <p>Integração com a API WaSender para envio de mensagens:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Envio de comunicados por turma via WhatsApp</li>
              <li>Envio de convites de matrícula para alunos selecionados</li>
              <li>Envio escalonado com delay aleatório de 5-8 segundos para evitar bloqueio</li>
              <li>Registro de status de entrega por destinatário</li>
              <li>Configuração de API key e device ID nas configurações</li>
            </ul>

            <SubTitle>4.3 Agendamento (pg_cron)</SubTitle>
            <p>Comunicados podem ser agendados para envio futuro:</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Agendamento de data e hora de envio</li>
              <li>Processamento automático via pg_cron que invoca Edge Function</li>
              <li>Status de comunicado: rascunho, agendado, enviando, enviado, falha</li>
            </ul>
          </div>

          {/* 5. SEGURANÇA */}
          <div>
            <SectionTitle>5. Segurança e Autenticação</SectionTitle>

            <SubTitle>5.1 Autenticação</SubTitle>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Login com e-mail e senha via Supabase Auth</li>
              <li>Sessões gerenciadas automaticamente com refresh token</li>
              <li>Logout seguro com limpeza de sessão</li>
              <li>Confirmação de e-mail para novos usuários</li>
            </ul>

            <SubTitle>5.2 Controle de Acesso (Roles)</SubTitle>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Roles armazenadas na tabela <code>user_roles</code> (separada da tabela profiles)</li>
              <li>Função <code>get_user_role()</code> para consulta de role do usuário autenticado</li>
              <li>Função <code>has_role()</code> SECURITY DEFINER para verificação sem recursão RLS</li>
              <li>Menus e interfaces adaptadas dinamicamente ao role do usuário</li>
            </ul>

            <SubTitle>5.3 Row Level Security (RLS)</SubTitle>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Todas as tabelas possuem RLS habilitado</li>
              <li>Políticas de SELECT, INSERT, UPDATE e DELETE por role</li>
              <li>Funções SECURITY DEFINER para operações que exigem elevação de privilégio</li>
              <li>Acesso a dados médicos e sensíveis restrito e auditado</li>
              <li>Instrutores acessam apenas dados de alunos de suas turmas/disciplinas</li>
              <li>Alunos acessam apenas seus próprios dados</li>
            </ul>

            <SubTitle>5.4 Auditoria</SubTitle>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Tabela <code>audit_logs</code> registra todas as operações sensíveis</li>
              <li>Log automático de acessos a dados pessoais e médicos</li>
              <li>Detecção de atividades suspeitas (múltiplas tentativas falhas, acessos incomuns)</li>
              <li>Edge Function <code>enhanced-audit-log</code> para logging avançado com IP e user agent</li>
            </ul>
          </div>

          {/* RODAPÉ */}
          <div style={{ marginTop: '60px', borderTop: '2px solid #e2e8f0', paddingTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#a0aec0', fontSize: '11px' }}>
              Inova Class — Sistema de Gestão Escolar © {new Date().getFullYear()}
            </p>
            <p style={{ color: '#a0aec0', fontSize: '11px' }}>
              Documento gerado automaticamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a365d', borderBottom: '3px solid #3182ce', paddingBottom: '6px', marginTop: '30px', marginBottom: '16px' }}>
    {children}
  </h2>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d3748', marginTop: '18px', marginBottom: '8px' }}>
    {children}
  </h3>
);

const ProfileSection = ({ title, permissions }: { title: string; permissions: string[] }) => (
  <div style={{ marginBottom: '16px' }}>
    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#2b6cb0', marginBottom: '6px' }}>{title}</h3>
    <ul style={{ paddingLeft: '20px' }}>
      {permissions.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  </div>
);

export default SystemDocumentation;
