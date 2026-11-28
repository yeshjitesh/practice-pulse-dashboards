ALTER TABLE public.mail_threads
  ADD COLUMN snoozed_until timestamptz,
  ADD COLUMN enquiry_id uuid REFERENCES public.contact_submissions(id) ON DELETE SET NULL;
CREATE INDEX mail_threads_snooze_idx ON public.mail_threads(snoozed_until) WHERE snoozed_until IS NOT NULL;
CREATE INDEX mail_threads_enquiry_idx ON public.mail_threads(enquiry_id) WHERE enquiry_id IS NOT NULL;

ALTER TABLE public.mail_messages ADD COLUMN scheduled_at timestamptz;

ALTER TABLE public.mail_settings ADD COLUMN signature_html text;

CREATE TABLE public.mail_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  html text NOT NULL DEFAULT '' CHECK (char_length(html) <= 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mail_templates TO service_role;
ALTER TABLE public.mail_templates ENABLE ROW LEVEL SECURITY;