-- 1) Remove confusing/unused instructor SELECT policy on profiles to avoid accidental exposure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Instructors can view limited student academic data'
  ) THEN
    EXECUTE 'DROP POLICY "Instructors can view limited student academic data" ON public.profiles';
  END IF;
END $$;

-- Keep existing clear policies intact:
--  - "Admins and secretaries can view all profiles" (SELECT)
--  - "Users can view own profile" (SELECT)
-- Instructors must use SECURITY DEFINER RPCs like get_instructor_viewable_student_data/get_instructor_students
