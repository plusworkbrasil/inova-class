-- Drop existing function that conflicts
DROP FUNCTION IF EXISTS public.get_student_basic_info_for_instructor(uuid);

-- Create security definer function for instructor access to student basic info only
CREATE OR REPLACE FUNCTION public.get_student_basic_info_for_instructor(target_student_id uuid)
RETURNS TABLE(
  id uuid,
  name text, 
  email text,
  student_id text,
  class_id uuid,
  enrollment_number text,
  status text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.name,
    p.email,
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

-- Create function to check if user can access medical data
CREATE OR REPLACE FUNCTION public.can_access_medical_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Only admins and secretaries can access medical data
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR 
    -- Users can access their own medical data
    auth.uid() = target_user_id;
$$;

-- Create function to check if user can access personal data (CPF, RG, etc.)
CREATE OR REPLACE FUNCTION public.can_access_personal_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admins and secretaries can access personal data
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR 
    -- Users can access their own personal data
    auth.uid() = target_user_id;
$$;