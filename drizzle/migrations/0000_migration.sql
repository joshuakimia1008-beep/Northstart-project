create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  title text not null default 'Financial Freedom Blueprint Tour',
  event_date date not null,
  status text not null default 'Proposed' check (status in ('Proposed','Confirmed','Next event','Completed','Tour finale')),
  venue text not null default 'Venue to be announced',
  description text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public read events" on public.events for select to anon, authenticated using (true);
create policy "admin insert events" on public.events for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update events" on public.events for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete events" on public.events for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  logo_url text,
  footer_video_url text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin insert settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.site_settings(id) values (1);

insert into public.events(city, title, event_date, status) values
('Boston','Financial Freedom Blueprint Tour','2026-09-19','Completed'),
('Auburn','Financial Freedom Blueprint Tour','2026-10-24','Next event'),
('Marlborough','Financial Freedom Blueprint Tour','2026-11-07','Confirmed'),
('Framingham','Financial Freedom Blueprint Tour','2026-11-21','Proposed'),
('Watertown','Financial Freedom Blueprint Tour','2027-01-09','Proposed'),
('Waltham','Financial Freedom Blueprint Tour','2027-01-23','Proposed'),
('Newton','Financial Freedom Blueprint Tour','2027-02-06','Proposed'),
('Cambridge','Financial Freedom Blueprint Tour','2027-02-20','Proposed'),
('Dorchester','Financial Freedom Blueprint Tour','2027-03-06','Proposed'),
('Quincy','Financial Freedom Blueprint Tour','2027-03-20','Proposed'),
('Shrewsbury','Financial Freedom Blueprint Tour','2027-04-03','Proposed'),
('Natick','Financial Freedom Blueprint Summit','2027-04-17','Tour finale');

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "admin update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));