
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('justification','communication','declaration','other')),
  reference_id uuid,
  status text NOT NULL CHECK (status IN ('sent','failed')),
  error_message text,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_send_log_sent_by ON public.email_send_log(sent_by);
CREATE INDEX idx_email_send_log_reference ON public.email_send_log(reference_id);
CREATE INDEX idx_email_send_log_sent_at ON public.email_send_log(sent_at DESC);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and secretaries can view all email logs"
ON public.email_send_log FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin','secretary'));

CREATE POLICY "Instructors can view their own email logs"
ON public.email_send_log FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'instructor'
  AND sent_by = auth.uid()
);
