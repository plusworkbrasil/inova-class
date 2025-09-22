-- Fix security: Add search_path to log_profile_update_attempt function
CREATE OR REPLACE FUNCTION public.log_profile_update_attempt(user_id uuid, target_id uuid, operation text, details text DEFAULT ''::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    accessed_fields
  ) VALUES (
    user_id,
    operation || '_ATTEMPT',
    'profiles',
    target_id,
    ARRAY[details]
  );
END;
$function$;