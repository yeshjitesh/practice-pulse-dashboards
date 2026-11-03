create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- First account to sign up becomes the site admin
create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
  for each row execute function public.assign_first_admin();

-- Contact message management
alter table public.contact_submissions add column status text not null default 'new';
grant select, update, delete on public.contact_submissions to authenticated;
create policy "Admins read messages" on public.contact_submissions for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update messages" on public.contact_submissions for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete messages" on public.contact_submissions for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Editable page content
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  role text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.testimonials, public.faqs to anon;
grant select, insert, update, delete on public.testimonials, public.faqs to authenticated;
grant all on public.testimonials, public.faqs to service_role;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
create policy "Public read testimonials" on public.testimonials for select to anon, authenticated using (true);
create policy "Admins write testimonials" on public.testimonials for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public read faqs" on public.faqs for select to anon, authenticated using (true);
create policy "Admins write faqs" on public.faqs for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.testimonials (quote, author, role, sort_order) values
('Example quote — replace with a real one. Our morning huddle now takes five minutes because everything we need is on one screen.', 'Practice Manager', 'Example GP practice', 1),
('Example quote — replace with a real one. Seeing appointment demand next to staffing helped us plan cover weeks ahead.', 'GP Partner', 'Example GP practice', 2),
('Example quote — replace with a real one. It was built around how we actually work, not the other way round.', 'Operations Lead', 'Example primary care network', 3);
insert into public.faqs (question, answer, sort_order) values
('What is a practice management dashboard?', 'A single screen that brings together the numbers your practice checks every day — appointments, staffing, finances and targets — so your team can make decisions quickly.', 1),
('How is PracticeMD different from off-the-shelf software?', 'We design each dashboard around your practice. You tell us what you need to see, and we build it to fit your workflow instead of forcing you into a fixed template.', 2),
('How long does it take?', 'It depends on what you need. After a first conversation we agree the scope and give you a clear timeline before any work starts.', 3),
('Is our data kept secure?', 'Security is part of every build. We agree with you where data is stored and who can see it before anything goes live.', 4);