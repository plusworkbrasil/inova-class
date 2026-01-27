

## Plano: Filtrar Alunos Ativos com Frequência "C" na Disciplina

### Problema Identificado

Atualmente, nas funcionalidades de Chamadas, Notas, Lista de Presença e Lista de Frequência na página `/subjects`, o sistema mostra **todos os alunos da turma**, incluindo:
- Alunos inativos (evadidos, cancelados, etc.)
- Alunos que nunca compareceram a nenhuma aula da disciplina

O usuário quer ver apenas alunos que:
1. Estão com `status = 'active'` na tabela `profiles`
2. Tiveram ao menos uma presença ("C") registrada na disciplina

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useInstructorSubjectAttendance.ts` | Adicionar filtro `status = 'active'` e filtrar apenas alunos com presença na disciplina |
| `src/hooks/useInstructorSubjectGrades.ts` | Adicionar filtro `status = 'active'` e filtrar apenas alunos com presença na disciplina |
| `src/pages/Subjects.tsx` | Modificar `handleExportSignatureSheet` e `handleExportWeeklyFrequency` para usar mesma lógica |

---

### Detalhes Técnicos

#### 1. Hook `useInstructorSubjectAttendance.ts`

**Alteração na busca de alunos (linha 65-69):**

```typescript
// ANTES:
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number')
  .eq('class_id', classId)
  .order('name');

// DEPOIS:
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number, status')
  .eq('class_id', classId)
  .eq('status', 'active')
  .order('name');
```

**Filtrar apenas alunos com presença (após transformToMatrix):**

```typescript
// Após buscar os dados, filtrar para mostrar apenas alunos que:
// 1. Estão ativos (já filtrado na query)
// 2. Tiveram ao menos uma presença ("C") na disciplina

const studentsWithAttendance = transformedData.students.filter(student => 
  student.total_present > 0  // Teve ao menos uma presença "C"
);
```

---

#### 2. Hook `useInstructorSubjectGrades.ts`

**Alteração na busca de alunos (linha 68-72):**

```typescript
// ANTES:
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number')
  .eq('class_id', classId)
  .order('name');

// DEPOIS:
// Primeiro buscar alunos ativos com presença na disciplina
const { data: attendanceData, error: attendanceError } = await supabase
  .from('attendance')
  .select('student_id')
  .eq('subject_id', subjectId)
  .eq('class_id', classId)
  .eq('is_present', true);

if (attendanceError) throw attendanceError;

// Extrair IDs únicos de alunos com presença
const studentIdsWithAttendance = [...new Set(
  (attendanceData || []).map(a => a.student_id)
)];

// Buscar perfis apenas desses alunos (ativos)
const { data: studentsData, error: studentsError } = await supabase
  .from('profiles')
  .select('id, name, student_id, enrollment_number')
  .eq('class_id', classId)
  .eq('status', 'active')
  .in('id', studentIdsWithAttendance.length > 0 ? studentIdsWithAttendance : ['00000000-0000-0000-0000-000000000000'])
  .order('name');
```

---

#### 3. Subjects.tsx - Lista de Presença e Frequência

**Modificar `handleExportSignatureSheet` (linhas 223-255):**

```typescript
const handleExportSignatureSheet = async (subject: any) => {
  try {
    // Buscar alunos ativos COM presença na disciplina
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('subject_id', subject.id)
      .eq('class_id', subject.class_id)
      .eq('is_present', true);

    if (attendanceError) throw attendanceError;

    const studentIdsWithAttendance = [...new Set(
      (attendanceData || []).map(a => a.student_id)
    )];

    if (studentIdsWithAttendance.length === 0) {
      toast({
        title: "Sem dados",
        description: "Nenhum aluno com presença registrada nesta disciplina.",
        variant: "destructive",
      });
      return;
    }

    const { data: students, error } = await supabase
      .from('profiles')
      .select('name, auto_student_id')
      .eq('class_id', subject.class_id)
      .eq('status', 'active')
      .in('id', studentIdsWithAttendance)
      .order('name');

    if (error) throw error;

    const formattedStudents = (students || []).map(s => ({
      name: s.name,
      number: s.auto_student_id?.toString() || ''
    }));

    await exportAttendanceSignatureSheet({
      subjectName: subject.name,
      className: getClassName(subject.class_id),
      students: formattedStudents
    });

    toast({
      title: "Lista de Presença exportada",
      description: "O PDF foi gerado com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro ao exportar",
      description: "Não foi possível gerar a lista de presença.",
      variant: "destructive",
    });
  }
};
```

**Modificar `handleExportWeeklyFrequency` (linhas 257-289)** com a mesma lógica.

---

### Fluxo de Filtragem

```
┌─────────────────────────────────────────────────────────────┐
│                    Consulta ao Banco                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Buscar IDs de alunos com is_present = true na disciplina │
│    (tabela: attendance)                                     │
├─────────────────────────────────────────────────────────────┤
│ 2. Buscar perfis filtrados:                                 │
│    - class_id = turma                                       │
│    - status = 'active'                                      │
│    - id IN (alunos com presença)                            │
├─────────────────────────────────────────────────────────────┤
│ 3. Retornar apenas alunos ativos COM frequência "C"         │
└─────────────────────────────────────────────────────────────┘
```

---

### Resultado Esperado

| Funcionalidade | Antes | Depois |
|----------------|-------|--------|
| Ver Chamadas | Todos da turma | Somente ativos com presença "C" |
| Exportar Notas | Todos da turma | Somente ativos com presença "C" |
| Lista de Presença | Todos da turma | Somente ativos com presença "C" |
| Lista de Frequência | Todos da turma | Somente ativos com presença "C" |

---

### Observação Importante

Se um aluno estiver ativo mas **nunca compareceu** a nenhuma aula da disciplina (somente faltas ou nenhum registro), ele **não aparecerá** nas listas. Isso garante que as listas mostrem apenas alunos que efetivamente participaram da disciplina.

