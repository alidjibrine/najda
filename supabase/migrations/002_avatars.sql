-- ============================================================
-- NAJDA — Migration 002 : photos de profil
-- ============================================================
-- Ajoute le support des avatars utilisateur :
--   1. Colonne avatar_url dans la table profiles
--   2. Bucket "avatars" dans Supabase Storage (public en lecture)
--   3. Policies pour que chaque user gère sa propre photo
-- ============================================================

-- 1. Colonne avatar_url
alter table profiles add column if not exists avatar_url text;

-- 2. Bucket "avatars" (créé s'il n'existe pas)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- 3. Policies pour le bucket avatars

-- Lecture publique (les photos doivent être visibles)
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload : utilisateurs authentifiés, dans leur propre dossier
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Modification (re-upload) de sa propre photo
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression de sa propre photo
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
