ALTER TABLE public.mail_settings
  ADD COLUMN signature jsonb,
  ADD COLUMN templates_seeded boolean NOT NULL DEFAULT false;