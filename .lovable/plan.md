
Diagnóstico confirmado:

- O problema não é mais o filtro por presença. Esse ajuste já está no hook.
- O caso atual é um desencontro entre a disciplina e a turma registrada no perfil dos alunos.
- Existem 4 disciplinas com o nome "Javascript, HTML, CSS". Os nomes citados por você ("Antonio da Silva Freire de Carvalho Neto" e "Carlos Henrique Siqueira Borges") pertencem à disciplina da turma `Jovem Tech T04B - Manhã` (`subject_id = 6b318ff0-527d-4882-9871-86cf3f56b840`).
- Nessa disciplina há 17 alunos com notas lançadas.
- Porém, no banco, só 2 desses 17 alunos ainda estão com `profiles.class_id = T04B`. Os outros 15 estão com `profiles.class_id = T04AB Manhã`.
- O hook `src/hooks/useInstructorSubjectGrades.ts` ainda faz este filtro:
  - busca perfis por `id in allStudentIds`
  - e também exige `.eq('class_id', classId)`
- Resultado: o exportador mostra apenas os 2 alunos cujo perfil ainda bate com a turma da disciplina.

Plano de correção:

1. Ajustar `src/hooks/useInstructorSubjectGrades.ts`
   - Remover o filtro rígido por `class_id` na busca dos perfis.
   - Buscar os perfis pelos IDs encontrados em `attendance`/`grades`.
   - Manter o filtro por `status = 'active'`.
   - Ordenar os alunos por nome no cliente para preservar a lista organizada.

2. Preservar a regra funcional do export
   - Continuar exibindo alunos que tenham vínculo real com a disciplina por:
     - presença na disciplina, ou
     - nota lançada na disciplina
   - Isso evita sumiço de alunos quando o perfil muda de turma depois que a nota já foi registrada.

3. Validar o caso específico
   - Abrir `/subjects` como admin
   - Exportar Notas da disciplina "Javascript, HTML, CSS" da turma correta
   - Confirmar que passam a aparecer os 17 alunos com nota, e não só Antonio e Carlos

4. Revisão opcional de dados
   - Depois da correção do código, revisar os 15 alunos que estão com nota em T04B mas perfil em T04AB
   - Se isso não for intencional, corrigir a turma cadastral desses perfis para evitar novas divergências em outros módulos

Detalhe técnico:
```text
Hoje:
profiles
  .eq('class_id', classId)
  .in('id', allStudentIds)

Correção:
profiles
  .in('id', allStudentIds)
  .eq('status', 'active')

+ ordenação por name no frontend
```

Arquivo a alterar:
- `src/hooks/useInstructorSubjectGrades.ts`
