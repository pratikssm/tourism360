create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_role text;
begin
  profile_name := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));
  profile_role := case
    when new.raw_user_meta_data ->> 'role' in ('BUSINESS_OWNER', 'TOUR_GUIDE', 'TRAVEL_AGENT')
      then new.raw_user_meta_data ->> 'role'
    else 'TOURIST'
  end;

  update public.profiles
  set name = profile_name, role = profile_role
  where email = new.email;

  if not found then
    insert into public.profiles (email, name, role)
    values (new.email, profile_name, profile_role);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();