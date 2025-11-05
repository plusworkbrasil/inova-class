-- Permitir instrutores visualizarem frequências das suas disciplinas
create policy "Instructors can view attendance for their subjects"
on public.attendance
for select
using (
  get_user_role(auth.uid()) = 'instructor'
  AND instructor_can_access_subject(auth.uid(), subject_id)
);