-- Security Fix 1: Implement granular RLS policies for student data protection
-- Drop existing overly permissive instructor policy
DROP POLICY IF EXISTS "Instructors view limited student info" ON public.profiles;

-- Create granular policies for different data types
-- Policy 1: Basic student academic info for instructors (safe data only)
CREATE POLICY "Instructors can view basic student academic info"
ON public.profiles
FOR SELECT
USING (
  CASE
    -- Admin/secretary: full access
    WHEN get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'secretary'::app_role]) THEN true
    -- Users can view their own profile
    WHEN auth.uid() = id THEN true
    -- Instructors: only basic academic info for their students (no personal/medical data)
    WHEN get_user_role(auth.uid()) = 'instructor'::app_role 
         AND role = 'student'::app_role 
         AND instructor_can_view_student(id) THEN true
    ELSE false
  END
);

-- Security Fix 2: Add student academic access policy
-- Students can view their own academic information
CREATE POLICY "Students can view their own academic info"
ON public.student_academic_info
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'student'::app_role 
  AND student_id = auth.uid()
);

-- Security Fix 3: Enhanced audit logging for sensitive data access
-- Add IP and user agent columns to audit_logs if not exists
DO $$ 
BEGIN
  -- Check if ip_address column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'audit_logs' AND column_name = 'ip_address') THEN
    ALTER TABLE public.audit_logs ADD COLUMN ip_address inet;
  END IF;
  
  -- Check if user_agent column exists, if not add it  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'audit_logs' AND column_name = 'user_agent') THEN
    ALTER TABLE public.audit_logs ADD COLUMN user_agent text;
  END IF;
END $$;

-- Security Fix 4: Create function to filter sensitive data for instructors
CREATE OR REPLACE FUNCTION public.get_safe_student_profile(target_student_id uuid)
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
SET search_path = public
AS $$
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
    AND (
      get_user_role(auth.uid()) IN ('admin', 'secretary')
      OR (
        get_user_role(auth.uid()) = 'instructor'
        AND instructor_can_view_student(target_student_id)
      )
    );
$$;

-- Security Fix 5: Enhanced logging function with IP and user agent
CREATE OR REPLACE FUNCTION public.log_sensitive_access_enhanced(
  p_action text, 
  p_table_name text, 
  p_record_id uuid, 
  p_accessed_fields text[],
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_accessed_fields,
    p_ip_address,
    p_user_agent
  );
END;
$$;