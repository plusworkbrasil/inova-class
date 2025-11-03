-- =====================================================
-- Políticas RLS de DELETE para grades e attendance
-- Restringe exclusões apenas para admin/secretary
-- =====================================================

-- 1. GRADES: Remover DELETE do policy "ALL" para instructors
DROP POLICY IF EXISTS "Instructors can manage grades for their subjects" ON grades;

-- Criar policy específico para instructors SEM DELETE
CREATE POLICY "Instructors can insert and update grades for their subjects"
ON grades
FOR ALL
USING (
  get_user_role(auth.uid()) = 'instructor'::app_role
  AND subject_id IN (
    SELECT s.id FROM subjects s
    WHERE s.teacher_id = auth.uid()
    OR s.name IN (
      SELECT unnest(instructor_subjects) FROM profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'instructor'::app_role
  AND subject_id IN (
    SELECT s.id FROM subjects s
    WHERE s.teacher_id = auth.uid()
    OR s.name IN (
      SELECT unnest(instructor_subjects) FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Criar policy específico de DELETE apenas para admin/secretary
CREATE POLICY "Only admins and secretaries can delete grades"
ON grades
FOR DELETE
USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'secretary'::app_role])
);

-- 2. ATTENDANCE: Remover DELETE do policy "ALL" para instructors
DROP POLICY IF EXISTS "Instructors can manage attendance for their subjects" ON attendance;

-- Criar policy específico para instructors SEM DELETE
CREATE POLICY "Instructors can insert and update attendance for their subjects"
ON attendance
FOR ALL
USING (
  get_user_role(auth.uid()) = 'instructor'::app_role
  AND subject_id IN (
    SELECT s.id FROM subjects s
    WHERE s.teacher_id = auth.uid()
    OR s.name IN (
      SELECT unnest(instructor_subjects) FROM profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'instructor'::app_role
  AND subject_id IN (
    SELECT s.id FROM subjects s
    WHERE s.teacher_id = auth.uid()
    OR s.name IN (
      SELECT unnest(instructor_subjects) FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Criar policy específico de DELETE apenas para admin/secretary
CREATE POLICY "Only admins and secretaries can delete attendance"
ON attendance
FOR DELETE
USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::app_role, 'secretary'::app_role])
);