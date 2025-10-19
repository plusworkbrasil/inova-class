-- ==========================================
-- FIX: Infinite recursion in user_roles RLS
-- ==========================================
-- This migration fixes the infinite recursion issue by:
-- 1. Dropping recursive policies on user_roles
-- 2. Creating simple, non-recursive policies
-- 3. Removing problematic policies on profiles that query user_roles

-- Step 1: Drop recursive policy on user_roles
DROP POLICY IF EXISTS "Admins and secretaries can manage roles v2" ON public.user_roles;

-- Step 2: Create simple, non-recursive SELECT policy for user_roles
-- Users can ONLY view their own roles (no subquery, no recursion)
CREATE POLICY "Users can view their own roles v3"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Step 3: Allow service role to manage roles (for edge functions)
-- This bypasses RLS, so no recursion risk
CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Drop the problematic profiles policy that queries user_roles
DROP POLICY IF EXISTS "Admins and secretaries can view all profiles v2" ON public.profiles;

-- Step 5: Create a new profiles SELECT policy using the security definer function
-- The has_role function is SECURITY DEFINER, so it won't trigger RLS recursion
CREATE POLICY "Admins and secretaries can view all profiles v3"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'secretary'::app_role)
);

-- Step 6: Ensure get_user_role function has proper fallback
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = $1 ORDER BY granted_at DESC LIMIT 1),
    'student'::app_role
  );
$$;

-- Verification query (for debugging)
-- SELECT * FROM public.user_roles WHERE user_id = auth.uid();