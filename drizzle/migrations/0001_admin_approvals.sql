create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(424242);
  if (select count(*) from public.user_roles where role='admin') < 2 then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function public.admin_list_users() returns table(id uuid, email text, created_at timestamptz, confirmed boolean, is_admin boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query select u.id, u.email::text, u.created_at, u.email_confirmed_at is not null,
    exists(select 1 from public.user_roles r where r.user_id=u.id and r.role='admin')
  from auth.users u order by u.created_at;
end $$;

create or replace function public.admin_set_admin(_target uuid, _make_admin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  if _make_admin then
    insert into public.user_roles(user_id, role) values (_target, 'admin') on conflict do nothing;
  else
    if _target = auth.uid() then raise exception 'You cannot remove your own admin access'; end if;
    delete from public.user_roles where user_id=_target and role='admin';
  end if;
end $$;

revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;