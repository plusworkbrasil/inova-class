# PROMPT DE RECRIAÇÃO - SISTEMA ESCOLAR COMPLETO

Crie um sistema completo de gestão escolar com as seguintes especificações:

## TECNOLOGIAS OBRIGATÓRIAS
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: API REST em PHP 7.4+ com MySQL
- Autenticação: JWT (firebase/php-jwt)
- Deploy: cPanel com MySQL/MariaDB

## ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais:
1. **profiles** - Usuários unificados (admin, secretary, instructor/teacher, student)
   - Campos: id, name, email, password, role, phone, endereço completo, avatar
   - Campos específicos para estudantes: student_id, class_id, enrollment_date, cpf, full_name, photo, parent_name, escolaridade, guardian_name, guardian_phone
   - Campos específicos para professores: teacher_id, instructor_subjects

2. **classes** - Turmas
   - Campos: id, name, grade, year, teacher_id, student_count

3. **subjects** - Disciplinas
   - Campos: id, name, class_id, teacher_id

4. **attendance** - Frequência
   - Campos: id, student_id, class_id, subject_id, date, is_present, justification

5. **grades** - Notas
   - Campos: id, student_id, subject_id, value, max_value, type, date, teacher_id

6. **communications** - Comunicações/Avisos
   - Campos: id, title, content, priority, target_audience (JSON), type, is_published, published_at, expires_at, author_id, attachments (JSON)

7. **declarations** - Declarações
   - Campos: id, student_id, title, type, purpose, description, subject_id, status, urgency, requested_at, processed_at, processed_by, file_path, delivery_date, observations

8. **evasions** - Evasões
   - Campos: id, student_id, date, reason, status, reported_by, observations

### Usuário Admin Padrão:
- Email: admin@escola.com
- Senha: admin123

## ESTRUTURA DO FRONTEND

### Páginas Principais:
1. **Auth.tsx** - Login/Registro
2. **Dashboard.tsx** - Dashboard personalizado por role
3. **Index.tsx** - Página inicial/seleção de usuário
4. **Users.tsx** - Gestão de usuários (admin)
5. **Classes.tsx** - Gestão de turmas
6. **Subjects.tsx** - Gestão de disciplinas
7. **Attendance.tsx** - Registro de frequência
8. **Grades.tsx** - Gestão de notas
9. **Communications.tsx** - Comunicações/Avisos
10. **Declarations.tsx** - Solicitação de declarações
11. **Evasions.tsx** - Registro de evasões
12. **Equipment.tsx** - Gestão de equipamentos
13. **Profile.tsx** - Perfil do usuário
14. **Reports.tsx** - Relatórios
15. **Settings.tsx** - Configurações

### Componentes Especiais:
1. **Layout.tsx** - Layout principal com navegação
2. **Navigation.tsx** - Menu lateral responsivo
3. **StudentNotifications.tsx** - Sistema de notificações para alunos
4. **StudentBanner.tsx** - Banner de avisos urgentes
5. **Forms/** - Formulários específicos para cada entidade

### Hooks Personalizados:
1. **useAuth.ts** - Wrapper para autenticação
2. **useApiAuth.ts** - Autenticação via API PHP
3. **useApiData.ts** - CRUD genérico para todas as entidades
4. **useApiCommunications.ts** - Gestão específica de comunicações

## ESTRUTURA DA API PHP

### Organização:
```
api/
├── config/
│   ├── database.php (conexão MySQL)
│   └── cors.php (configurações CORS)
├── auth/
│   ├── login.php
│   └── register.php
├── crud/
│   ├── profiles.php
│   ├── classes.php
│   ├── subjects.php
│   ├── grades.php
│   ├── attendance.php
│   ├── communications.php
│   ├── declarations.php
│   └── evasions.php
├── utils/
│   └── jwt.php (geração/validação JWT)
└── vendor/ (firebase/php-jwt via Composer)
```

### Funcionalidades da API:
- Todos os endpoints CRUD para cada entidade
- Validação JWT em rotas protegidas
- Respostas padronizadas em JSON
- Tratamento de erros apropriado
- Suporte a CORS

## SISTEMA DE ROLES E PERMISSÕES

### Roles Disponíveis:
1. **admin** - Acesso total ao sistema
2. **secretary** - Gestão administrativa e documentos
3. **instructor/teacher** - Ensino e avaliação
4. **student** - Visualização de dados pessoais
5. **coordinator** - Coordenação acadêmica
6. **tutor** - Acompanhamento de alunos

### Permissões por Role:
- **Admin**: Todas as funcionalidades
- **Secretary**: Declarações, comunicações, frequência, usuários
- **Teacher**: Notas, frequência, comunicações (visualização)
- **Student**: Dashboard personalizado, perfil, declarações
- **Coordinator**: Turmas, disciplinas, relatórios, comunicações
- **Tutor**: Frequência, comunicações, relatórios específicos

## FUNCIONALIDADES ESPECIAIS

### Dashboard Personalizado:
- Cards de estatísticas específicos por role
- Notificações e avisos em tempo real para estudantes
- Banner de avisos urgentes
- Sistema de mudança rápida de perfil para demonstração

### Sistema de Comunicações:
- Criação de avisos com prioridade
- Segmentação por público-alvo
- Sistema de publicação
- Anexos (suporte básico)

### Gestão de Declarações:
- Solicitação online pelos estudantes
- Workflow de aprovação
- Geração de documentos
- Controle de status e urgência

### Sistema de Frequência:
- Registro por disciplina e data
- Justificativas de faltas
- Relatórios automáticos
- Alertas de evasão

## DESIGN E UX

### Estilo Visual:
- Design system consistente com Tailwind CSS
- Componentes shadcn/ui customizados
- Modo escuro/claro (implementar se necessário)
- Layout responsivo para mobile e desktop
- Cores semânticas do design system

### Experiência do Usuário:
- Menu lateral colapsável
- Navegação intuitiva por role
- Feedback visual para todas as ações
- Loading states apropriados
- Toasts informativos para operações

## CONFIGURAÇÃO PARA PRODUÇÃO

### Deploy no cPanel:
1. Upload dos arquivos frontend buildados para public_html/
2. Upload da API PHP para public_html/api/
3. Configuração do banco MySQL via phpMyAdmin
4. Instalação da biblioteca JWT (Composer ou manual)
5. Configuração de .htaccess para SPA
6. Configuração das variáveis de ambiente

### Arquivo .htaccess obrigatório:
```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^.*$ - [L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^.*$ - [L]
RewriteRule ^.*$ index.html [L]
```

## ARQUIVOS DE CONFIGURAÇÃO IMPORTANTES

### src/lib/api.ts:
```typescript
const API_BASE_URL = 'https://seu-dominio.com/api'; // ALTERAR PARA PRODUÇÃO
```

### api/config/database.php:
```php
private $host = 'localhost';
private $db_name = 'seu_usuario_escola_db';
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### api/utils/jwt.php:
```php
private static $secret_key = "SUA_CHAVE_SECRETA_SUPER_FORTE_AQUI";
```

## OBSERVAÇÕES IMPORTANTES

1. **Não usar Supabase** - Sistema 100% independente com PHP + MySQL
2. **Autenticação JWT** - Implementação completa de login/logout
3. **CRUD Completo** - Todas as operações para todas as entidades
4. **Responsivo** - Funciona perfeitamente em mobile e desktop
5. **Segurança** - Validação adequada em frontend e backend
6. **Performance** - Otimizações para carregamento rápido
7. **Manutenibilidade** - Código limpo e bem estruturado

## CREDENCIAIS DE TESTE

Após instalação, usar:
- **Admin**: admin@escola.com / admin123
- Criar outros usuários via interface administrativa

## PRÓXIMOS PASSOS APÓS CRIAÇÃO

1. Implementar sistema de backup automático
2. Adicionar relatórios avançados com gráficos
3. Sistema de mensagens internas
4. Integração com sistemas externos (se necessário)
5. Melhorias de UX baseadas no feedback dos usuários

---

**IMPORTANTE**: Este sistema foi projetado para ser independente de qualquer serviço externo, rodando completamente em hospedagem cPanel tradicional com PHP e MySQL.