CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN RETURN NEW; END $$;
COMMENT ON FUNCTION public.assign_first_admin() IS 'DEPRECATED: admin access now uses a server-validated shared-code session; signup must never grant admin privileges.';
GRANT ALL ON public.contact_submissions, public.chat_conversations, public.chat_messages TO service_role;