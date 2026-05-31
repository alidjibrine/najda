-- ============================================================
-- NAJDA — Migration 009 : RÉPARATION COMPLÈTE DES RÔLES
-- ============================================================
-- À RUN APRÈS les migrations 007 et 008.
-- Cette migration est idempotente (re-runable) et fait 4 choses :
--
--   1. Réinstalle proprement le trigger handle_new_user
--      qui lit le rôle depuis raw_user_meta_data.role
--      (au cas où 008 n'aurait pas été appliquée correctement)
--
--   2. BACKFILL : Pour TOUS les comptes existants, relit
--      raw_user_meta_data.role depuis auth.users et corrige
--      profiles.role en conséquence.
--      → Ton compte créé en "pro" qui est resté en "client"
--        sera réparé automatiquement.
--
--   3. Crée une fonction RPC sécurisée set_my_role(text)
--      pour que l'app puisse switcher le rôle proprement.
--
--   4. Vérifie les RLS sur profiles : tout user authentifié
--      peut lire et update SA PROPRE ligne (sa colonne role
--      incluse).
-- ============================================================


-- ============================================================
-- 1. TRIGGER handle_new_user — version robuste (re-déclarée)
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  -- Lit le rôle passé par supabase.auth.signUp({options:{data:{role}}})
  user_role := coalesce(
    new.raw_user_meta_data->>'role',
    new.raw_app_meta_data->>'role',
    'client'
  );

  if user_role not in ('client', 'pro') then
    user_role := 'client';
  end if;

  insert into public.profiles (id, role)
  values (new.id, user_role)
  on conflict (id) do update
    set role = excluded.role;

  return new;
exception when others then
  -- Jamais casser un signup
  raise warning 'handle_new_user error: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- 2. BACKFILL — Corrige tous les profils existants
-- ============================================================
-- Pour chaque user dans auth.users, on relit son role déclaré
-- au signup et on l'écrit dans profiles.role.
-- Si aucun role n'était passé → on garde 'client' (défaut).

update public.profiles p
set role = coalesce(
  u.raw_user_meta_data->>'role',
  u.raw_app_meta_data->>'role',
  p.role,
  'client'
)
from auth.users u
where p.id = u.id
  and coalesce(
    u.raw_user_meta_data->>'role',
    u.raw_app_meta_data->>'role'
  ) in ('client', 'pro');


-- ============================================================
-- 3. RPC set_my_role(role) — pour switcher depuis l'app
-- ============================================================
-- Permet à un user authentifié de changer son propre rôle
-- de manière sécurisée (SECURITY DEFINER + check du caller).

create or replace function set_my_role(new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Non authentifié';
  end if;

  if new_role not in ('client', 'pro') then
    raise exception 'Rôle invalide : %', new_role;
  end if;

  insert into public.profiles (id, role)
  values (caller_id, new_role)
  on conflict (id) do update
    set role = excluded.role,
        updated_at = now();
end;
$$;

grant execute on function set_my_role(text) to authenticated;


-- ============================================================
-- 4. RLS sur profiles — s'assurer que le user peut update SA ligne
-- ============================================================
-- (Re-déclaration idempotente des policies essentielles)

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);


-- ============================================================
-- 5. DIAGNOSTIC — à la fin du run, vérifie ton propre rôle
-- ============================================================
-- (Cette requête s'affiche dans l'onglet "Results" du SQL Editor)

select
  p.id,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as signup_role_meta,
  u.email,
  p.created_at
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at desc;
