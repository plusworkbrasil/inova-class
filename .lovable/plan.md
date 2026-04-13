

# Plano: Botão cinza para disciplinas sem frequência há 30+ dias

## Problema
Na seção "Lançamento Rápido de Notas", todas as disciplinas mostram o botão "Lançar Notas" com o mesmo estilo, sem indicar quais disciplinas estão sem registro de frequência há mais de 30 dias.

## Solução
Buscar a data do último registro de frequência de cada disciplina do instrutor e, se não houver registro nos últimos 30 dias, exibir o botão em cinza com um indicador visual (tooltip ou texto explicativo).

## Alterações em `src/pages/TeacherGrades.tsx`

1. **Novo state** para armazenar a última data de frequência por disciplina:
```typescript
const [lastAttendanceDates, setLastAttendanceDates] = useState<Record<string, string | null>>({});
```

2. **Novo useEffect** para buscar o último registro de frequência por subject_id:
```typescript
useEffect(() => {
  async function fetchLastAttendance() {
    if (!instructorSubjects?.length) return;
    const ids = instructorSubjects.map(s => s.id);
    // Para cada disciplina, buscar a data mais recente de attendance
    const { data } = await supabase
      .from('attendance')
      .select('subject_id, date')
      .in('subject_id', ids)
      .order('date', { ascending: false });
    
    const latest: Record<string, string | null> = {};
    ids.forEach(id => { latest[id] = null; });
    (data || []).forEach(record => {
      if (!latest[record.subject_id]) {
        latest[record.subject_id] = record.date;
      }
    });
    setLastAttendanceDates(latest);
  }
  fetchLastAttendance();
}, [instructorSubjects]);
```

3. **No render do botão** (linha ~304-309), calcular se faz 30+ dias sem frequência e aplicar estilo cinza:
```typescript
const lastDate = lastAttendanceDates[subject.id];
const noRecentAttendance = !lastDate || 
  differenceInDays(new Date(), new Date(lastDate)) > 30;

<Button 
  size="sm"
  variant={noRecentAttendance ? "secondary" : "default"}
  onClick={openBatchGradeForm}
>
  Lançar Notas
</Button>
{noRecentAttendance && (
  <p className="text-xs text-muted-foreground">
    Sem frequência há mais de 30 dias
  </p>
)}
```

4. **Import** adicional: `differenceInDays` de `date-fns`.

## Arquivo alterado
- `src/pages/TeacherGrades.tsx`

