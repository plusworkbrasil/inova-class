-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Instructors can view students from their classes" ON public.profiles;

-- Create a new secure policy that doesn't cause recursion
-- This policy allows instructors to view students who are in classes where the instructor teaches
CREATE POLICY "Instructors can view their students" 
ON public.profiles
FOR SELECT
USING (
  -- Allow if user is viewing their own profile
  auth.uid() = id
  OR
  -- Allow if user is admin or secretary (already handled by other policies)
  get_user_role(auth.uid()) IN ('admin', 'secretary')
  OR
  -- Allow instructors to view students in their classes
  -- This checks if the student's class has subjects taught by the instructor
  (
    get_user_role(auth.uid()) = 'instructor'
    AND EXISTS (
      SELECT 1 
      FROM subjects s
      WHERE s.class_id = profiles.class_id
        AND s.teacher_id = auth.uid()
        AND get_user_role(profiles.id) = 'student'
    )
  )
);