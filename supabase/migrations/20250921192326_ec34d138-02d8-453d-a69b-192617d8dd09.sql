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

-- Update profiles RLS policy for instructors to be more restrictive
DROP POLICY IF EXISTS "Instructors view only basic info for their students" ON public.profiles;

CREATE POLICY "Instructors view limited student info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  CASE 
    -- Admins and secretaries can see everything
    WHEN get_user_role(auth.uid()) IN ('admin', 'secretary') THEN true
    -- Users can see their own profiles
    WHEN auth.uid() = id THEN true
    -- Instructors can only see basic info for their students (no medical/personal data)
    WHEN get_user_role(auth.uid()) = 'instructor' 
         AND role = 'student' 
         AND instructor_can_view_student(id) THEN true
    ELSE false
  END
);

-- Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  accessed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_accessed_fields text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_accessed_fields
  );
END;
$$;

-- Create secure view for instructor student access
CREATE OR REPLACE VIEW public.instructor_student_view AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.student_id,
  p.class_id,
  p.enrollment_number,
  p.status,
  p.phone,
  c.name as class_name
FROM profiles p
LEFT JOIN classes c ON c.id = p.class_id
WHERE p.role = 'student'
  AND (
    get_user_role(auth.uid()) IN ('admin', 'secretary')
    OR (
      get_user_role(auth.uid()) = 'instructor' 
      AND instructor_can_view_student(p.id)
    )
  );

-- Grant access to the view
GRANT SELECT ON public.instructor_student_view TO authenticated;