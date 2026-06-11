-- 1) Permitir user_id nulo em audit_logs (operações automáticas / sistema)
ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- 2) Corrigir trigger de auditoria para usar NULL no lugar do UUID zero (violava FK)
CREATE OR REPLACE FUNCTION public.audit_table_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_action text;
  v_record_id uuid;
  v_fields text[] := ARRAY[]::text[];
  v_old jsonb;
  v_new jsonb;
  v_key text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'RECORD_CREATED';
    v_new := to_jsonb(NEW);
    BEGIN v_record_id := (NEW).id; EXCEPTION WHEN others THEN v_record_id := NULL; END;
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key NOT IN ('created_at','updated_at') AND v_new->>v_key IS NOT NULL THEN
        v_fields := array_append(v_fields, v_key);
      END IF;
    END LOOP;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'RECORD_UPDATED';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    BEGIN v_record_id := (NEW).id; EXCEPTION WHEN others THEN v_record_id := NULL; END;
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key NOT IN ('updated_at','created_at')
         AND (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
        v_fields := array_append(v_fields, v_key);
      END IF;
    END LOOP;
    IF array_length(v_fields, 1) IS NULL THEN
      RETURN NEW;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'RECORD_DELETED';
    v_old := to_jsonb(OLD);
    BEGIN v_record_id := (OLD).id; EXCEPTION WHEN others THEN v_record_id := NULL; END;
    FOR v_key IN SELECT jsonb_object_keys(v_old) LOOP
      IF v_key NOT IN ('created_at','updated_at') AND v_old->>v_key IS NOT NULL THEN
        v_fields := array_append(v_fields, v_key);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
  VALUES (v_user, v_action, TG_TABLE_NAME, v_record_id, v_fields);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Modo manutenção: seed da linha (idempotente)
INSERT INTO public.system_settings (category, key, value)
VALUES ('system', 'maintenance_mode', jsonb_build_object('enabled', false))
ON CONFLICT DO NOTHING;

-- 4) Policy: qualquer autenticado pode ler a linha de manutenção
DROP POLICY IF EXISTS "Anyone authenticated can read maintenance flag" ON public.system_settings;
CREATE POLICY "Anyone authenticated can read maintenance flag"
ON public.system_settings
FOR SELECT
TO authenticated
USING (category = 'system' AND key = 'maintenance_mode');

-- 5) Função pública para consultar manutenção
CREATE OR REPLACE FUNCTION public.is_maintenance_mode()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT (value->>'enabled')::boolean
       FROM public.system_settings
      WHERE category = 'system' AND key = 'maintenance_mode'
      LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO anon, authenticated;

-- 6) Função para alternar (apenas admin)
CREATE OR REPLACE FUNCTION public.set_maintenance_mode(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o modo manutenção';
  END IF;

  UPDATE public.system_settings
     SET value = jsonb_build_object(
                   'enabled', p_enabled,
                   'updated_by', auth.uid(),
                   'updated_at', now()
                 ),
         updated_at = now()
   WHERE category = 'system' AND key = 'maintenance_mode';

  IF NOT FOUND THEN
    INSERT INTO public.system_settings (category, key, value)
    VALUES ('system', 'maintenance_mode',
            jsonb_build_object('enabled', p_enabled,
                               'updated_by', auth.uid(),
                               'updated_at', now()));
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, accessed_fields)
  VALUES (auth.uid(),
          CASE WHEN p_enabled THEN 'MAINTENANCE_ENABLED' ELSE 'MAINTENANCE_DISABLED' END,
          'system_settings', NULL, ARRAY['maintenance_mode']);

  RETURN p_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_maintenance_mode(boolean) TO authenticated;

-- 7) Realtime para reagir ao toggle em todos os clientes
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'system_settings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings';
  END IF;
END $$;