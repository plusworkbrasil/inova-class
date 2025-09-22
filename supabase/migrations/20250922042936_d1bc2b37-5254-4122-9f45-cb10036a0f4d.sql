-- Create a secure function that returns only essential academic data for instructors
CREATE OR REPLACE FUNCTION public.get_instructor_viewable_student_data(target_student_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  student_id text,
  class_id uuid,
  enrollment_number text,
  status text,
  role app_role
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only return basic academic info if instructor has permission
  SELECT 
    p.id,
    p.name,
    p.email,
    p.student_id,
    p.class_id,
    p.enrollment_number,
    p.status,
    p.role
  FROM profiles p
  WHERE p.id = target_student_id
    AND p.role = 'student'
    AND instructor_can_view_student(target_student_id)
    AND get_user_role(auth.uid()) = 'instructor';
$$;

-- Drop the overly permissive instructor policy
DROP POLICY IF EXISTS "Instructors can view basic student academic info" ON public.profiles;

-- Create a new, more restrictive policy for instructors
-- This policy only allows access through the secure function above
CREATE POLICY "Instructors can view limited student academic data" 
ON public.profiles 
FOR SELECT 
USING (
  CASE
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]) THEN true
    WHEN auth.uid() = id THEN true
    -- Instructors cannot directly access student profiles
    -- They must use the get_instructor_viewable_student_data function
    WHEN get_user_role(auth.uid()) = 'instructor'::app_role AND role = 'student'::app_role THEN false
    ELSE false
  END
);

-- Add a comment explaining the security model
COMMENT ON FUNCTION public.get_instructor_viewable_student_data IS 
'Secure function for instructors to access only essential academic data of their students. 
Does not expose sensitive personal information like CPF, addresses, medical data, or guardian details.';

-- Create an audit trigger for the secure function usage
CREATE OR REPLACE FUNCTION public.audit_instructor_student_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when instructors access student data
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields
  ) VALUES (
    auth.uid(),
    'VIEW_STUDENT_ACADEMIC_DATA',
    'profiles',
    NEW.id,
    ARRAY['id', 'name', 'email', 'student_id', 'class_id', 'enrollment_number', 'status', 'role']
  );
  RETURN NEW;
END;
$$;