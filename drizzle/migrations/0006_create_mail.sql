CREATE TABLE public.mail_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mail_folders TO service_role;
ALTER TABLE public.mail_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mail_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '',
  normalized_subject text NOT NULL DEFAULT '',
  snippet text NOT NULL DEFAULT '',
  participants text NOT NULL DEFAULT '',
  folder text NOT NULL DEFAULT 'inbox',
  custom_folder_id uuid REFERENCES public.mail_folders(id) ON DELETE SET NULL,
  previous_folder text,
  starred boolean NOT NULL DEFAULT false,
  unread boolean NOT NULL DEFAULT false,
  has_attachments boolean NOT NULL DEFAULT false,
  has_sent boolean NOT NULL DEFAULT false,
  has_draft boolean NOT NULL DEFAULT false,
  message_count integer NOT NULL DEFAULT 0,
  binned_at timestamptz,
  follow_up_at timestamptz,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_threads_folder_idx ON public.mail_threads(folder, last_message_at DESC);
CREATE INDEX mail_threads_custom_idx ON public.mail_threads(custom_folder_id);
GRANT ALL ON public.mail_threads TO service_role;
ALTER TABLE public.mail_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.mail_threads(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'in',
  status text NOT NULL DEFAULT 'received',
  provider_id text UNIQUE,
  message_id_header text,
  in_reply_to text,
  references_header text,
  from_address text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT '',
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[] NOT NULL DEFAULT '{}',
  bcc_addresses text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL DEFAULT '',
  html text,
  text_body text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_messages_thread_idx ON public.mail_messages(thread_id, sent_at);
CREATE INDEX mail_messages_msgid_idx ON public.mail_messages(message_id_header);
GRANT ALL ON public.mail_messages TO service_role;
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mail_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.mail_messages(id) ON DELETE CASCADE,
  filename text NOT NULL DEFAULT 'attachment',
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  size integer NOT NULL DEFAULT 0,
  storage_path text,
  provider_attachment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_attachments_message_idx ON public.mail_attachments(message_id);
GRANT ALL ON public.mail_attachments TO service_role;
ALTER TABLE public.mail_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mail_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.mail_messages(id) ON DELETE CASCADE,
  provider_event_id text UNIQUE,
  type text NOT NULL,
  detail text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mail_events_message_idx ON public.mail_events(message_id);
GRANT ALL ON public.mail_events TO service_role;
ALTER TABLE public.mail_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mail_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  webhook_id text,
  webhook_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mail_settings TO service_role;
ALTER TABLE public.mail_settings ENABLE ROW LEVEL SECURITY;