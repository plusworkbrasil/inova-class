
ALTER TABLE public.selected_students
ADD COLUMN whatsapp_sent_at timestamptz,
ADD COLUMN whatsapp_message_id text,
ADD COLUMN whatsapp_status text;
