-- =====================================================
-- PHASE 1: REVOKE PUBLIC PERMISSIONS (CRITICAL FIX)
-- =====================================================
-- Revoke all permissions from anon and public roles on all tables
REVOKE ALL ON public.profiles FROM anon, public;
REVOKE ALL ON public.grades FROM anon, public;
REVOKE ALL ON public.attendance FROM anon, public;
REVOKE ALL ON public.student_academic_info FROM anon, public;
REVOKE ALL ON public.communications FROM anon, public;
REVOKE ALL ON public.declarations FROM anon, public;
REVOKE ALL ON public.evasions FROM anon, public;
REVOKE ALL ON public.audit_logs FROM anon, public;
REVOKE ALL ON public.equipment FROM anon, public;
REVOKE ALL ON public.equipment_allocations FROM anon, public;
REVOKE ALL ON public.classes FROM anon, public;
REVOKE ALL ON public.subjects FROM anon, public;
REVOKE ALL ON public.system_settings FROM anon, public;

-- Grant permissions ONLY to authenticated users (RLS will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_academic_info TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.declarations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evasions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;

-- =====================================================
-- PHASE 2: SECURE ROLE ARCHITECTURE
-- =====================================================
-- Create user_roles table (app_role enum already exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    granted_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles table
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create security definer function to check roles (prevents privilege escalation)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update get_user_role to use secure user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1),
    'student'::app_role
  );
$$;

-- =====================================================
-- PHASE 4: STORAGE BUCKET HARDENING
-- =====================================================
-- Restrict declarations bucket to safe file types and size limit
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
],
file_size_limit = 10485760 -- 10MB limit
WHERE name = 'declarations';

-- Add security documentation
COMMENT ON TABLE public.profiles IS 'User profiles - Contains sensitive PII. Access controlled by RLS and role-based permissions. Roles stored separately in user_roles table.';
COMMENT ON TABLE public.user_roles IS 'User role assignments - Separate from profiles to prevent privilege escalation attacks. Uses security definer functions for safe role checks.';