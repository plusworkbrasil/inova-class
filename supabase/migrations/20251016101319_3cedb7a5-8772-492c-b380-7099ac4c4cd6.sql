-- Corrigir todas as políticas RLS que causam recursão
-- Substituir get_user_role() por consulta direta a user_roles

-- ====== ATTENDANCE ======
DROP POLICY IF EXISTS "Admins and secretaries can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can manage attendance for their subjects" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;

CREATE POLICY "Admins and secretaries can manage all attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);

CREATE POLICY "Instructors can manage attendance for their subjects"
ON public.attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'instructor'
  )
  AND subject_id IN (
    SELECT s.id FROM subjects s
    WHERE s.teacher_id = auth.uid()
      OR s.name = ANY(
        SELECT unnest(instructor_subjects)
        FROM profiles
        WHERE id = auth.uid()
      )
  )
);

CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'student'
  )
  AND student_id = auth.uid()
);

-- ====== CLASSES ======
DROP POLICY IF EXISTS "Admins and secretaries can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Instructors can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own class" ON public.classes;

CREATE POLICY "Admins and secretaries can manage all classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);

CREATE POLICY "Instructors can view all classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'instructor'
  )
);

CREATE POLICY "Students can view their own class"
ON public.classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'student'
  )
  AND id IN (
    SELECT class_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- ====== SUBJECTS ======
DROP POLICY IF EXISTS "Admins and secretaries can manage all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Instructors can manage their subjects" ON public.subjects;
DROP POLICY IF EXISTS "Students can view subjects from their class" ON public.subjects;

CREATE POLICY "Admins and secretaries can manage all subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
  )
);

CREATE POLICY "Instructors can manage their subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'instructor'
  )
  AND (
    teacher_id = auth.uid()
    OR name IN (
      SELECT unnest(instructor_subjects)
      FROM profiles
      WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Students can view subjects from their class"
ON public.subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'student'
  )
  AND class_id IN (
    SELECT class_id FROM profiles
    WHERE id = auth.uid()
  )
);