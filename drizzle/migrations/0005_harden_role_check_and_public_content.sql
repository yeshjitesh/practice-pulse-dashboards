CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ select _user_id = auth.uid() and exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read published faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published);
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read published testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_published);