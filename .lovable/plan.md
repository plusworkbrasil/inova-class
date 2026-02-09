

## Tutor com Dashboard e Relatorios de Admin

### Objetivo
Fazer o role **Tutor** utilizar o mesmo Dashboard e Relatorios do Admin, em vez do TutorDashboard simplificado.

### Mudancas

| Arquivo | O que muda |
|---------|------------|
| `src/pages/Dashboard.tsx` | Tutor passa a renderizar `AdminDashboard` em vez de `TutorDashboard` |
| `src/pages/Reports.tsx` | Usar o role real do usuario (via `useAuth`) em vez de hardcoded `'admin'` |
| `src/components/layout/Navigation.tsx` | Adicionar ao menu do tutor as rotas de relatorios que faltam (`/students-at-risk`, `/class-timeline`) e o item de Notas por Disciplina (`/subject-grades`) para paridade com admin |

### Detalhes Tecnicos

**1. `src/pages/Dashboard.tsx` (linhas 79-85)**

Alterar o bloco do tutor para renderizar o AdminDashboard:

```typescript
if (userRole === 'tutor') {
  return (
    <Layout userRole={userRole} userName={userName} userAvatar="">
      <AdminDashboard />
    </Layout>
  );
}
```

O titulo dentro do AdminDashboard diz "Dashboard do Administrador" - opcionalmente pode ser parametrizado, mas como o tutor tera a mesma visao, nao e obrigatorio alterar agora.

**2. `src/pages/Reports.tsx` (linhas 18-20)**

Substituir o role hardcoded por dados reais do usuario autenticado:

```typescript
// Remover:
const [userRole, setUserRole] = useState<UserRole>('admin');
const [userName, setUserName] = useState('Admin');

// Adicionar:
import { useAuth } from '@/hooks/useAuth';
// ...
const { profile } = useAuth();
const userRole = (profile?.role as UserRole) || 'admin';
const userName = profile?.name || 'Usuário';
```

Isso garante que o Layout receba o role correto (tutor) e mostre o menu lateral adequado.

**3. `src/components/layout/Navigation.tsx` - Menu do Tutor**

Adicionar ao array `menuItems.tutor` os itens que o admin tem em Dashboard/Relatorios e que o tutor ainda nao possui:

- `{ icon: BookOpen, label: 'Notas por Disciplina', path: '/subject-grades' }` - dentro do contexto de aulas
- `{ icon: AlertTriangle, label: 'Alunos em Risco', path: '/students-at-risk' }` - relatorios

O menu do tutor ja inclui: Dashboard, Turmas, Frequencia, Disciplinas, Evasoes, Declaracoes, Comunicacao, Relatorios, Historico do Aluno, Alunos Faltosos. Com essas adicoes, tera paridade com o admin nas areas de Dashboard e Relatorios.

### O que NAO muda

- O tutor continua sem acesso a **Gestao Administrativa** (Usuarios, Equipamentos, Configuracoes, Avisos) - essas funcionalidades permanecem exclusivas do admin/secretary.
- As rotas ja estao registradas no `App.tsx` e nao precisam de alteracao.
- Os hooks de dados (`useReportsData`, `useDashboardStats`, etc.) nao filtram por role, entao funcionam normalmente para o tutor.

