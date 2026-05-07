
-- 1. Audit logs: restrict insert to authenticated users only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Remove audit_logs from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs';
  END IF;
END $$;

-- 3. Privilege escalation: split secretary vs admin role-management policies
DROP POLICY IF EXISTS "Admins and secretaries can insert any user role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and secretaries can update any user role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and secretaries can delete any user role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and secretaries can view all user roles" ON public.user_roles;

CREATE POLICY "Admins and secretaries can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Secretaries can insert limited roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'secretary'::app_role)
  AND role IN ('student'::app_role, 'instructor'::app_role)
);

CREATE POLICY "Secretaries can update limited roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'secretary'::app_role)
  AND role IN ('student'::app_role, 'instructor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'secretary'::app_role)
  AND role IN ('student'::app_role, 'instructor'::app_role)
);

CREATE POLICY "Secretaries can delete limited roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'secretary'::app_role)
  AND role IN ('student'::app_role, 'instructor'::app_role)
);

-- 4. get_user_role: don't default to 'student' for unauthenticated users
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY granted_at DESC LIMIT 1;
$function$;
