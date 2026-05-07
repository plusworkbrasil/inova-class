-- ============ Tabela de tentativas ============
CREATE TABLE IF NOT EXISTS public.unauthorized_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_role text,
  attempted_route text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uaa_user_time
  ON public.unauthorized_access_attempts (user_id, attempted_at DESC);

ALTER TABLE public.unauthorized_access_attempts ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler. Inserções vêm pela RPC SECURITY DEFINER.
CREATE POLICY "Admins can view unauthorized access attempts"
ON public.unauthorized_access_attempts
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ RPC: registra tentativa e bloqueia se necessário ============
CREATE OR REPLACE FUNCTION public.record_unauthorized_access_attempt(p_route text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- registra a tentativa
  INSERT INTO public.unauthorized_access_attempts (user_id, user_role, attempted_route)
  VALUES (v_user, v_role, p_route);

  -- audit log
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
  VALUES (v_user, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'profiles', v_user, ARRAY[p_route, COALESCE(v_role,'unknown')]);

  -- conta tentativas nos últimos 5 minutos
  SELECT count(*) INTO v_recent
  FROM public.unauthorized_access_attempts
  WHERE user_id = v_user
    AND attempted_at >= now() - interval '5 minutes';

  IF v_recent >= 3 THEN
    -- bloqueia o perfil
    UPDATE public.profiles
    SET status = 'blocked',
        updated_at = now()
    WHERE id = v_user
      AND status <> 'blocked';

    v_blocked := FOUND;

    IF v_blocked THEN
      -- audit log do bloqueio
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
      VALUES (v_user, 'ACCOUNT_AUTO_BLOCKED', 'profiles', v_user,
              ARRAY['rota=' || p_route, 'tentativas=' || v_recent::text]);

      -- notifica todos admins/secretárias
      FOR admin_record IN
        SELECT user_id FROM public.user_roles
        WHERE role IN ('admin'::app_role, 'secretary'::app_role)
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
$$;

-- ============ Verificar se a conta está bloqueada ============
CREATE OR REPLACE FUNCTION public.is_account_blocked(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status = 'blocked' FROM public.profiles WHERE id = p_user_id),
    false
  );
$$;

-- ============ Liberar conta (apenas admin) ============
CREATE OR REPLACE FUNCTION public.unblock_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem desbloquear contas';
  END IF;

  UPDATE public.profiles
  SET status = 'active', updated_at = now()
  WHERE id = p_user_id AND status = 'blocked';

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
  VALUES (auth.uid(), 'ACCOUNT_UNBLOCKED', 'profiles', p_user_id, ARRAY['manual_admin_unblock']);
END;
$$;

-- expor execute às roles autenticadas
GRANT EXECUTE ON FUNCTION public.record_unauthorized_access_attempt(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_account_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid) TO authenticated;