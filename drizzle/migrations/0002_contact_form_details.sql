ALTER TABLE public.contact_submissions
  ADD COLUMN phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  ADD COLUMN job_role text CHECK (job_role IS NULL OR char_length(job_role) <= 80),
  ADD COLUMN organisation_type text CHECK (organisation_type IS NULL OR char_length(organisation_type) <= 80),
  ADD COLUMN list_size text CHECK (list_size IS NULL OR char_length(list_size) <= 40),
  ADD COLUMN clinical_system text CHECK (clinical_system IS NULL OR char_length(clinical_system) <= 80),
  ADD COLUMN interests text[] CHECK (interests IS NULL OR cardinality(interests) <= 30),
  ADD COLUMN timeline text CHECK (timeline IS NULL OR char_length(timeline) <= 80),
  ADD COLUMN contact_preference text CHECK (contact_preference IS NULL OR char_length(contact_preference) <= 40),
  ADD COLUMN heard_about text CHECK (heard_about IS NULL OR char_length(heard_about) <= 120);