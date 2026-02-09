

## Adicionar "Visao de Turmas" ao Menu do Tutor

### Mudanca

**Arquivo: `src/components/layout/Navigation.tsx`**

Adicionar o item abaixo ao array `menuItems.tutor`, junto aos outros itens de relatorios:

```typescript
{ icon: GraduationCap, label: 'Visão de Turmas', path: '/class-timeline' }
```

Sera inserido apos "Alunos em Risco" para manter a mesma ordem logica dos relatorios do admin.

Nenhum outro arquivo precisa ser alterado -- a rota `/class-timeline` ja esta registrada no `App.tsx`.

