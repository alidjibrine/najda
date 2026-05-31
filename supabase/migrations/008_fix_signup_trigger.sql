-- ============================================================
-- NAJDA — Migration 008 : trigger handle_new_user robuste
-- ============================================================
-- Corrige "Database error saving new user" lors des signups.
-- Le trigger lit maintenant le rôle depuis raw_user_meta_data
-- (passé via supabase.auth.signUp({ options: { data: { role } }})).
-- Il ne casse plus jamais le signup, même en cas d'erreur interne.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  -- Récupérer le rôle depuis les metadata du signup
  user_role := coalesce(
    new.raw_user_meta_data->>'role',
    new.raw_app_meta_data->>'role',
    'client'
  );

  if user_role not in ('client', 'pro') then
    user_role := 'client';
  end if;

  insert into profiles (id, role)
  values (new.id, user_role)
  on conflict (id) do update set role = excluded.role;

  return new;
exception when others then
  -- Ne JAMAIS casser un signup à cause d'une erreur dans ce trigger.
  -- On log l'erreur et on retourne quand même new pour laisser passer.
  raise warning 'handle_new_user error: %', sqlerrm;
  return new;
end;
$$;

-- S'assurer que le trigger est bien attaché
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
