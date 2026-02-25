
-- Table to track class communication sends via WhatsApp
CREATE TABLE public.class_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  sent_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, sending, sent, failed, scheduled
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  send_results jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.class_communications ENABLE ROW LEVEL SECURITY;

-- Admins, tutors, coordinators can manage
CREATE POLICY "Admins secretaries tutors coordinators can manage class comms"
ON public.class_communications
FOR ALL
USING (get_user_role(auth.uid()) IN ('admin', 'secretary', 'tutor', 'coordinator'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'secretary', 'tutor', 'coordinator'));

-- Trigger for updated_at
CREATE TRIGGER update_class_communications_updated_at
BEFORE UPDATE ON public.class_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
