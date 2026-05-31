-- ============================================================
-- NAJDA — Script de RESET des 4 comptes utilisateurs
-- ============================================================
-- ⚠️ ATTENTION : ce script SUPPRIME définitivement les 4 comptes
-- existants ET toutes leurs données (réservations, messages,
-- notifications, etc.). Puis il les recrée avec un mot de passe
-- commun connu.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run
--
-- 🔑 MOT DE PASSE DES 4 COMPTES : Najda2026!
-- ============================================================

do $$
declare
  v_password         text := 'Najda2026!';
  v_hashed_password  text;

  -- IDs des anciens comptes (lookup)
  v_old_client  uuid;
  v_old_pro1    uuid;
  v_old_pro2    uuid;
  v_old_pro3    uuid;

  -- IDs des nouveaux comptes (générés)
  v_new_client  uuid := gen_random_uuid();
  v_new_pro1    uuid := gen_random_uuid();
  v_new_pro2    uuid := gen_random_uuid();
  v_new_pro3    uuid := gen_random_uuid();
begin
  -- ============================================================
  -- 1. Hash bcrypt du mot de passe (extension pgcrypto)
  -- ============================================================
  v_hashed_password := crypt(v_password, gen_salt('bf'));

  -- ============================================================
  -- 2. Lookup des UUIDs des anciens comptes
  -- ============================================================
  select id into v_old_client from auth.users where email = 'adoummhtdjibrine25@gmail.com';
  select id into v_old_pro1   from auth.users where email = 'adoumexpert@gmail.com';
  select id into v_old_pro2   from auth.users where email = 'adoumdjibrine@gmail.com';
  select id into v_old_pro3   from auth.users where email = 'alidjibrine@gmail.com';

  -- ============================================================
  -- 3. Nettoyage des FK sans CASCADE qui bloqueraient le delete
  --    ⚠️ ORDRE IMPORTANT — sinon erreur de FK
  -- ============================================================
  -- 3a. Avis (FK reviews.user_id sans CASCADE)
  delete from reviews
    where user_id in (v_old_client, v_old_pro1, v_old_pro2, v_old_pro3)
       and user_id is not null;

  -- 3b. Bookings où l'un de ces comptes est pro_id (FK sans CASCADE)
  update bookings set pro_id = null
    where pro_id in (v_old_client, v_old_pro1, v_old_pro2, v_old_pro3);

  -- 3c. Bookings qui référencent les fiches artisan publiques de mes pros
  --     (FK bookings.artisan_id sans CASCADE — il faut les supprimer
  --     AVANT les artisans, sinon le delete artisans échoue)
  delete from bookings where artisan_id in (
    'pro-' || substring(replace(v_old_pro1::text, '-', '') from 1 for 12),
    'pro-' || substring(replace(v_old_pro2::text, '-', '') from 1 for 12),
    'pro-' || substring(replace(v_old_pro3::text, '-', '') from 1 for 12)
  );

  -- 3d. Identités auth (FK user_id sans CASCADE selon versions Supabase)
  delete from auth.identities
    where user_id in (v_old_client, v_old_pro1, v_old_pro2, v_old_pro3);

  -- ============================================================
  -- 4. Suppression des 4 anciens comptes auth.users
  --    Cascade automatique sur : profiles, pro_profiles,
  --    bookings.user_id (et donc conversations + messages),
  --    user_favorites, notifications, artisan_availability
  -- ============================================================
  delete from auth.users where email in (
    'adoummhtdjibrine25@gmail.com',
    'adoumexpert@gmail.com',
    'adoumdjibrine@gmail.com',
    'alidjibrine@gmail.com'
  );

  -- ============================================================
  -- 4bis. Suppression des fiches artisan publiques de mes pros
  --       (faite APRÈS auth.users pour que toutes les bookings
  --       les référençant aient été cascade-deleted)
  -- ============================================================
  delete from artisans where id in (
    'pro-' || substring(replace(v_old_pro1::text, '-', '') from 1 for 12),
    'pro-' || substring(replace(v_old_pro2::text, '-', '') from 1 for 12),
    'pro-' || substring(replace(v_old_pro3::text, '-', '') from 1 for 12)
  );

  -- ============================================================
  -- 5. Création des 4 nouveaux comptes
  -- ============================================================
  -- ⚠️ Le trigger handle_new_user va automatiquement créer un profile
  --    pour chaque INSERT, en lisant raw_user_meta_data->>'role'.

  -- CLIENT (adoummhtdjibrine25@gmail.com)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_new_client, 'authenticated', 'authenticated',
    'adoummhtdjibrine25@gmail.com', v_hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"client"}'::jsonb,
    now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_new_client, v_new_client::text,
    jsonb_build_object(
      'sub', v_new_client::text,
      'email', 'adoummhtdjibrine25@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- PRO 1 — Plomberie (adoumexpert@gmail.com)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_new_pro1, 'authenticated', 'authenticated',
    'adoumexpert@gmail.com', v_hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"pro"}'::jsonb,
    now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_new_pro1, v_new_pro1::text,
    jsonb_build_object(
      'sub', v_new_pro1::text,
      'email', 'adoumexpert@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- PRO 2 — Électricité (adoumdjibrine@gmail.com)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_new_pro2, 'authenticated', 'authenticated',
    'adoumdjibrine@gmail.com', v_hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"pro"}'::jsonb,
    now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_new_pro2, v_new_pro2::text,
    jsonb_build_object(
      'sub', v_new_pro2::text,
      'email', 'adoumdjibrine@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- PRO 3 — Serrurerie (alidjibrine@gmail.com)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_new_pro3, 'authenticated', 'authenticated',
    'alidjibrine@gmail.com', v_hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"pro"}'::jsonb,
    now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_new_pro3, v_new_pro3::text,
    jsonb_build_object(
      'sub', v_new_pro3::text,
      'email', 'alidjibrine@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- ============================================================
  -- Rapport final
  -- ============================================================
  raise notice '=====================================================';
  raise notice 'RESET DES 4 COMPTES TERMINÉ ✅';
  raise notice '-----------------------------------------------------';
  raise notice '🔑 Mot de passe pour les 4 comptes : %', v_password;
  raise notice '-----------------------------------------------------';
  raise notice 'adoummhtdjibrine25@gmail.com → role=client (UUID: %)', v_new_client;
  raise notice 'adoumexpert@gmail.com        → role=pro    (UUID: %)', v_new_pro1;
  raise notice 'adoumdjibrine@gmail.com      → role=pro    (UUID: %)', v_new_pro2;
  raise notice 'alidjibrine@gmail.com        → role=pro    (UUID: %)', v_new_pro3;
  raise notice '=====================================================';
  raise notice 'IMPORTANT : ré-exécute la migration 010_seed_test_data.sql';
  raise notice 'pour repeupler la base avec les données de test.';
  raise notice '=====================================================';
end $$;

-- ============================================================
-- Diagnostic : vérifier que les 4 nouveaux comptes existent
-- ============================================================
select
  u.email,
  p.role,
  u.email_confirmed_at is not null as email_verifie,
  u.raw_user_meta_data->>'role' as role_meta,
  to_char(u.created_at, 'DD/MM/YYYY HH24:MI:SS') as cree_le
from auth.users u
left join profiles p on p.id = u.id
where u.email in (
  'adoummhtdjibrine25@gmail.com',
  'adoumexpert@gmail.com',
  'adoumdjibrine@gmail.com',
  'alidjibrine@gmail.com'
)
order by p.role, u.email;
