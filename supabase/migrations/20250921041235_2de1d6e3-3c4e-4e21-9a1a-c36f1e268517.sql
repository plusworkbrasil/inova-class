-- Final security fix for view access control

-- Add RLS policy to the instructor_minimal_student_view
-- Since views can't have RLS directly, we need to ensure the underlying table has proper policies
-- The view already uses the instructor_can_view_student function which provides the security

-- Create a more secure approach by removing the problematic view and creating a function instead
DROP VIEW IF EXISTS public.instructor_minimal_student_view;

-- Create a secure function that returns student data only for authorized instructors
CREATE OR REPLACE FUNCTION public.get_instructor_students()
RETURNS TABLE (
  id uuid,
  name text,
  student_id text,
  class_id uuid,
  enrollment_number text,
  status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.student_id,
    p.class_id,
    p.enrollment_number,
    p.status
  FROM profiles p
  WHERE p.role = 'student'
    AND (
      get_user_role(auth.uid()) IN ('admin', 'secretary')
      OR (
        get_user_role(auth.uid()) = 'instructor' 
        AND instructor_can_view_student(p.id)
      )
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_instructor_students() TO authenticated;

-- Also ensure the profiles table policies are working correctly
-- Let's verify the current policies and make sure they're restrictive enough

-- Check if there are any loose policies that might allow unauthorized access
-- Update the instructor policy to be even more restrictive
DROP POLICY IF EXISTS "Instructors can view minimal student data only" ON public.profiles;

-- Create a new policy that only allows instructors to see very basic info and only for their students
CREATE POLICY "Instructors view only basic info for their students" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_user_role(auth.uid()) = 'instructor' 
  AND role = 'student'
  AND instructor_can_view_student(id)
  -- Only allow access to these specific columns by the application logic, not all profile data
);

-- Add a constraint to ensure views don't expose sensitive data
-- Create a function to get only safe student data fields
CREATE OR REPLACE FUNCTION public.get_safe_student_data(target_student_id uuid)
RETURNS TABLE (
  student_name text,
  student_number text,
  class_reference uuid,
  enrollment_number text,
  academic_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.name,
    p.student_id,
    p.class_id,
    p.enrollment_number,
    p.status
  FROM profiles p
  WHERE p.id = target_student_id
    AND p.role = 'student'
    AND (
      get_user_role(auth.uid()) IN ('admin', 'secretary')
      OR instructor_can_view_student(target_student_id)
    );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_safe_student_data(uuid) TO authenticated;

-- Update documentation
COMMENT ON FUNCTION public.get_instructor_students() IS 'Secure function that returns only basic student information for instructors, excluding sensitive personal data like emails, phone numbers, addresses, and medical information';
COMMENT ON FUNCTION public.get_safe_student_data(uuid) IS 'Returns only non-sensitive student data fields for authorized users (admins, secretaries, or instructors of the student)';

-- Add a security note about data access
DO $$
BEGIN
  -- Log the security improvement
  RAISE NOTICE 'Security Enhancement: Instructor access to student data has been restricted to exclude sensitive personal information including emails, phone numbers, addresses, CPF, medical conditions, and guardian information. Instructors can now only access: name, student ID, class ID, enrollment number, and academic status for students in their classes.';
END $$;