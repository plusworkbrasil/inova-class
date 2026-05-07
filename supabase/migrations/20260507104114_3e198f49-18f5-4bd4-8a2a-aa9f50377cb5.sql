
-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Ignora updates sem alteração relevante
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
  VALUES (
    COALESCE(v_user, '00000000-0000-0000-0000-000000000000'::uuid),
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    v_fields
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Helper para criar triggers
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles','classes','subjects','attendance','grades','declarations','evasions',
    'equipment','equipment_allocations','equipment_incidents','communications',
    'class_communications','notifications','selected_students','students_at_risk',
    'risk_interventions','system_settings','user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_changes ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I_changes
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes()',
      t, t
    );
  END LOOP;
END$$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- Realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='audit_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs';
  END IF;
END$$;
