

## Ajustes nos cards de disciplinas do instrutor

### Alteracoes

**Arquivo: `src/pages/InstructorSubjects.tsx`**

1. Remover o botao "Fazer Chamada" (linhas 133-138)
2. Renomear o botao "Ver Chamadas" para "Ver Frequencia"
3. Como sobra apenas um botao, ele pode ocupar a largura total (`w-full` em vez de `flex-1`)

### O que NAO muda
- A funcionalidade de visualizar frequencia permanece igual
- O dialog `SubjectAttendanceMatrixDialog` continua funcionando normalmente
- O `AttendanceForm` permanece no codigo (pode ser usado futuramente), apenas o botao e removido da interface

