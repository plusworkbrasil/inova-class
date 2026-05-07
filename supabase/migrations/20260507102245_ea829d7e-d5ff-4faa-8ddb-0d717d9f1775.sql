CREATE OR REPLACE FUNCTION public.record_unauthorized_access_attempt(p_route text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
  v_recent int;
  v_blocked boolean := false;
  admin_record record;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  v_role := public.get_user_role(v_user)::text;

  INSERT INTO public.unauthorized_access_attempts (user_id, user_role, attempted_route)
  VALUES (v_user, v_role, p_route);

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
  VALUES (v_user, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'profiles', v_user, ARRAY[p_route, COALESCE(v_role,'unknown')]);

  SELECT count(*) INTO v_recent
  FROM public.unauthorized_access_attempts
  WHERE user_id = v_user
    AND attempted_at >= now() - interval '5 minutes';

  IF v_recent >= 3 THEN
    UPDATE public.profiles
    SET status = 'blocked',
        updated_at = now()
    WHERE id = v_user
      AND status <> 'blocked';

    v_blocked := FOUND;

    IF v_blocked THEN
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
      VALUES (v_user, 'ACCOUNT_AUTO_BLOCKED', 'profiles', v_user,
              ARRAY['rota=' || p_route, 'tentativas=' || v_recent::text]);

      -- Notifica APENAS administradores gerais (role admin)
      FOR admin_record IN
        SELECT user_id FROM public.user_roles
        WHERE role = 'admin'::app_role
      LOOP
        INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (
          admin_record.user_id,
          'Conta bloqueada por tentativas não autorizadas',
          'Um usuário foi bloqueado após 3 tentativas de acessar área restrita em 5 minutos. Rota: ' || p_route,
          'warning',
          v_user,
          'profile_blocked'
        );
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'blocked', v_blocked,
    'recent_attempts', v_recent
  );
END;
$function$;