

## Substituir "Chamada" por "Frequência" em todo o sistema

Foram encontradas **~30 ocorrências** em **12 arquivos** que ainda usam o termo "Chamada" no contexto de frequência escolar.

### Arquivos e alteracoes

**1. `src/components/layout/Navigation.tsx`** (linha 178)
- Menu lateral: `'Chamada'` -> `'Frequência'`

**2. `src/components/dashboard/InstructorDashboard.tsx`** (linha 151)
- `Acesse o menu "Chamada"` -> `Acesse o menu "Frequência"`

**3. `src/pages/Attendance.tsx`** (linhas 127-128, 147, 738)
- `"Chamada já registrada!"` -> `"Frequência já registrada!"`
- `"Já existe uma chamada registrada..."` -> `"Já existe uma frequência registrada..."`
- `"Use 'Alterar Chamada'"` -> `"Use 'Alterar Frequência'"`
- `"Chamada registrada com sucesso!"` -> `"Frequência registrada com sucesso!"`
- `"registrar uma chamada"` -> `"registrar uma frequência"`

**4. `src/pages/InstructorSubjects.tsx`** (linhas 53, 67, 75)
- Console log e toast: `"chamada"` -> `"frequência"`
- `"Chamada registrada com sucesso!"` -> `"Frequência registrada com sucesso!"`

**5. `src/pages/StudentHistory.tsx`** (linhas 316, 397)
- `"Total de Chamadas"` -> `"Total de Frequências"`
- `"chamadas"` -> `"frequências"` (nos detalhes por disciplina)

**6. `src/pages/Evasions.tsx`** (linha 632)
- `"novas chamadas"` -> `"novos registros de frequência"`

**7. `src/pages/Subjects.tsx`** (linhas 559, 721)
- `"Exportar Chamadas"` -> `"Exportar Frequência"`

**8. `src/components/forms/AttendanceForm.tsx`** (linhas 369, 473)
- `"Lista de Chamada"` -> `"Lista de Frequência"`
- `"Salvar Chamada"` -> `"Salvar Frequência"`

**9. `src/components/ui/subject-attendance-matrix-dialog.tsx`** (linhas 137, 151, 203)
- `"Chamadas - {subjectName}"` -> `"Frequência - {subjectName}"`
- `"chamada"/"chamadas"` -> `"registro"/"registros"`
- `"Nenhuma chamada registrada"` -> `"Nenhuma frequência registrada"`

**10. `src/components/ui/subject-attendance-export-dialog.tsx`** (linhas 130, 133, 167, 171)
- `"Chamadas - {subjectName}"` -> `"Frequência - {subjectName}"`
- `"chamadas registradas"` -> `"frequências registradas"`
- `"Erro ao carregar chamadas"` -> `"Erro ao carregar frequência"`
- `"Nenhuma chamada registrada"` -> `"Nenhuma frequência registrada"`

**11. `src/components/ui/attendance-view-dialog.tsx`** (linha 22)
- `"Detalhes da Chamada"` -> `"Detalhes da Frequência"`

**12. `src/components/ui/attendance-group-details-dialog.tsx`** (linhas 51, 70, 203-204)
- `"Detalhes da Chamada"` -> `"Detalhes da Frequência"`
- `"Excluir Chamada"` -> `"Excluir Frequência"`
- `"Excluir Registro de Chamada"` -> `"Excluir Registro de Frequência"`
- `"excluir esta chamada"` -> `"excluir esta frequência"`

**13. `src/lib/attendanceExport.ts`** (linhas 78, 321)
- `"chamadas realizadas"` -> `"frequências realizadas"`
- `"Total de chamadas"` -> `"Total de frequências"`

### Nao alterar (falsos positivos)
- `src/lib/api.ts` linha 6: "chamadas da API" - termo tecnico, nao relacionado a frequencia
- `src/hooks/useVirtualSecretary.ts` linha 29: "chamadas duplicadas" - termo tecnico

### Total: 13 arquivos, ~30 substituicoes de texto
