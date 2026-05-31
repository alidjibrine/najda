-- ============================================================
-- NAJDA — Migration 007 : rôles, planning, favoris, notifications
-- ============================================================
-- Fondations pour la version "deux faces" : client / prestataire.
--
-- Ajoute :
--   1. Colonne role aux profils (client | pro)
--   2. Table pro_profiles (profil pro étendu)
--   3. Table artisan_availability (créneaux hebdomadaires)
--   4. Table booking_slots (créneaux bloqués par RDV)
--   5. Table user_favorites
--   6. Table notifications (in-app)
--   7. Enrichissement bookings.status + colonnes
--   8. RLS policies pour tout
-- ============================================================

-- ============================================================
-- 1. RÔLE sur profiles
-- ============================================================

alter table profiles
  add column if not exists role text not null default 'client'
    check (role in ('client', 'pro'));

create index if not exists profiles_role_idx on profiles(role);

-- ============================================================
-- 2. PROFIL PRO étendu
-- ============================================================
-- Un pro a un profil étendu lié au profile.id (uuid auth.users)
-- + lié à un "artisan" public visible aux clients.

create table if not exists pro_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  artisan_id text references artisans(id) on delete set null,
  category_id text references categories(id),
  city text,
  zone_km integer not null default 15,
  price_range text not null default '€€',
  price_hourly_eur numeric(6,2),
  bio text,
  services text[] not null default '{}',
  photos text[] not null default '{}',
  years_exp integer not null default 0,
  verified boolean not null default false,
  insured boolean not null default false,
  accepts_emergency boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_profiles_category_idx on pro_profiles(category_id);
create index if not exists pro_profiles_artisan_idx on pro_profiles(artisan_id);

alter table pro_profiles enable row level security;

drop policy if exists "pro_select_own" on pro_profiles;
create policy "pro_select_own" on pro_profiles
  for select using (auth.uid() = id);

drop policy if exists "pro_update_own" on pro_profiles;
create policy "pro_update_own" on pro_profiles
  for update using (auth.uid() = id);

drop policy if exists "pro_insert_own" on pro_profiles;
create policy "pro_insert_own" on pro_profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- 3. PLANNING — disponibilités hebdomadaires
-- ============================================================
-- Chaque pro déclare ses créneaux récurrents par jour de semaine.
-- day_of_week : 0 = dimanche, 1 = lundi, …, 6 = samedi
-- time format : "HH:MM" (ex: "09:00")

create table if not exists artisan_availability (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists artisan_availability_pro_idx
  on artisan_availability(pro_id);

alter table artisan_availability enable row level security;

-- Lecture publique pour que les clients voient les dispos
drop policy if exists "avail_select_public" on artisan_availability;
create policy "avail_select_public" on artisan_availability
  for select using (true);

drop policy if exists "avail_manage_own" on artisan_availability;
create policy "avail_manage_own" on artisan_availability
  for all using (auth.uid() = pro_id)
  with check (auth.uid() = pro_id);

-- ============================================================
-- 4. CRÉNEAUX BLOQUÉS (ad hoc — pour absences, vacances)
-- ============================================================

create table if not exists pro_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references auth.users(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists blocked_slots_pro_idx
  on pro_blocked_slots(pro_id);
create index if not exists blocked_slots_dates_idx
  on pro_blocked_slots(pro_id, start_at, end_at);

alter table pro_blocked_slots enable row level security;

drop policy if exists "blocked_select_public" on pro_blocked_slots;
create policy "blocked_select_public" on pro_blocked_slots
  for select using (true);

drop policy if exists "blocked_manage_own" on pro_blocked_slots;
create policy "blocked_manage_own" on pro_blocked_slots
  for all using (auth.uid() = pro_id)
  with check (auth.uid() = pro_id);

-- ============================================================
-- 5. FAVORIS
-- ============================================================

create table if not exists user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  artisan_id text not null references artisans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artisan_id)
);

create index if not exists user_favorites_user_idx
  on user_favorites(user_id);

alter table user_favorites enable row level security;

drop policy if exists "fav_manage_own" on user_favorites;
create policy "fav_manage_own" on user_favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 6. NOTIFICATIONS in-app
-- ============================================================
-- Types : booking_accepted, booking_rejected, booking_reminder,
--         new_message, review_request, booking_completed, system

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx
  on notifications(user_id, read);

alter table notifications enable row level security;

drop policy if exists "notif_select_own" on notifications;
create policy "notif_select_own" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own" on notifications
  for update using (auth.uid() = user_id);

drop policy if exists "notif_insert_any" on notifications;
create policy "notif_insert_any" on notifications
  for insert with check (true);

-- ============================================================
-- 7. BOOKINGS enrichi
-- ============================================================
-- On garde l'ancien check + on en ajoute un nouveau qui inclut
-- tous les statuts métier complets.

alter table bookings
  add column if not exists duration_min integer not null default 90,
  add column if not exists end_time text,
  add column if not exists pro_id uuid references auth.users(id),
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists completed_at timestamptz,
  add column if not exists cancellation_reason text;

-- Recréer la contrainte pour inclure les nouveaux statuts
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings
  add constraint bookings_status_check check (
    status in (
      'pending',     -- en attente d'acceptation pro
      'accepted',    -- accepté par le pro
      'rejected',    -- refusé par le pro
      'confirmed',   -- payé + confirmé
      'in_progress', -- mission en cours
      'completed',   -- mission terminée
      'cancelled',   -- annulé par client/pro
      'reviewed'     -- avis laissé
    )
  );

create index if not exists bookings_pro_status_idx
  on bookings(pro_id, status);

-- ============================================================
-- 8. REVIEWS : lier à un booking + rendre RLS strict
-- ============================================================

alter table reviews
  add column if not exists booking_id uuid references bookings(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id);

create unique index if not exists reviews_booking_unique
  on reviews(booking_id) where booking_id is not null;

alter table reviews enable row level security;

drop policy if exists "reviews_select_public" on reviews;
create policy "reviews_select_public" on reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on reviews;
create policy "reviews_insert_own" on reviews
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- 9. TRIGGER : empêcher de bloquer un créneau déjà accepté
-- (souplesse simple : on confie ça à la logique applicative
-- pour ne pas surcomplexifier la DB. Le check se fait dans api.ts)
-- ============================================================

-- ============================================================
-- 10. NOTIFICATIONS automatiques via triggers
-- ============================================================
-- Quand un booking est créé → notif au pro
-- Quand un booking est accepté → notif au client
-- Quand un booking est refusé → notif au client

create or replace function notify_booking_event()
returns trigger language plpgsql security definer
as $$
begin
  if tg_op = 'INSERT' then
    -- Booking créé : notifier le pro (s'il a un compte)
    if new.pro_id is not null then
      insert into notifications (user_id, type, title, body, data)
      values (
        new.pro_id,
        'booking_request',
        'Nouvelle demande',
        'Un client souhaite réserver une prestation',
        jsonb_build_object('booking_id', new.id)
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status = 'accepted' and old.status <> 'accepted' then
      insert into notifications (user_id, type, title, body, data)
      values (
        new.user_id,
        'booking_accepted',
        'Rendez-vous accepté',
        'Votre artisan a confirmé l''intervention',
        jsonb_build_object('booking_id', new.id)
      );
    elsif new.status = 'rejected' and old.status <> 'rejected' then
      insert into notifications (user_id, type, title, body, data)
      values (
        new.user_id,
        'booking_rejected',
        'Demande refusée',
        coalesce(new.rejection_reason, 'L''artisan n''est pas disponible'),
        jsonb_build_object('booking_id', new.id)
      );
    elsif new.status = 'completed' and old.status <> 'completed' then
      insert into notifications (user_id, type, title, body, data)
      values (
        new.user_id,
        'review_request',
        'Comment s''est passée votre intervention ?',
        'Laissez un avis pour aider la communauté',
        jsonb_build_object('booking_id', new.id)
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_booking_notify on bookings;
create trigger trg_booking_notify
  after insert or update on bookings
  for each row execute function notify_booking_event();
