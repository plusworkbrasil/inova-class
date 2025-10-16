-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Instructors can view their students" ON public.profiles;

-- Create a new secure policy that doesn't cause recursion
-- This policy allows instructors to view students in classes where they teach
-- WITHOUT checking the student's role (avoids recursion)
CREATE POLICY "Instructors can view students in their classes" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Instructors can view profiles in classes where they teach
  get_user_role(auth.uid()) = 'instructor'
  AND EXISTS (
    SELECT 1 
    FROM subjects s
    WHERE s.class_id = profiles.class_id
      AND s.teacher_id = auth.uid()
  )
);

-- Note: Other policies already exist and work correctly:
-- "Users can view own profile" - allows auth.uid() = id
-- "Admins and secretaries can view all profiles" - allows admin/secretary roles