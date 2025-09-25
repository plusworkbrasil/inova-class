-- Fix RLS policies to properly restrict sensitive data access

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Secretaries can view basic profile data" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view student basic data" ON public.profiles;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No manual audit log modifications" ON public.audit_logs;
DROP POLICY IF EXISTS "No manual audit log deletions" ON public.audit_logs;

-- Create granular policies for profile access
CREATE POLICY "Secretaries can view basic profile data" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'secretary' 
  AND role != 'admin' -- Secretaries cannot view admin profiles
);

CREATE POLICY "Instructors can view student basic data" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'instructor' 
  AND role = 'student'
  AND instructor_can_view_student(id)
);

-- Restrict sensitive field access with separate function
CREATE OR REPLACE FUNCTION public.can_access_sensitive_fields(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Only admins can access all sensitive fields
    get_user_role(auth.uid()) = 'admin'
    OR 
    -- Users can access their own sensitive data
    auth.uid() = target_user_id;
$$;

-- Fix audit logs policies to be more restrictive
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Ensure no one can modify or delete audit logs
CREATE POLICY "No manual audit log modifications" 
ON public.audit_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "No manual audit log deletions" 
ON public.audit_logs 
FOR DELETE 
USING (false);