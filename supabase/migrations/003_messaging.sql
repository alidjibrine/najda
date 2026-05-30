-- ============================================================
-- NAJDA — Migration 003 : messagerie temps réel
-- ============================================================
-- Ajoute :
--   1. Table conversations (une par RDV)
--   2. Table messages
--   3. Triggers : auto-crée la conversation et le message système
--      à chaque nouvelle réservation
--   4. RLS policies
--   5. Realtime activé sur conversations + messages
-- ============================================================

-- 1. Tables
drop table if exists messages cascade;
drop table if exists conversations cascade;

create table conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  artisan_id text not null references artisans(id),
  last_message_text text,
  last_message_at timestamptz,
  user_unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(booking_id)
);

create index conversations_user_idx on conversations(user_id);
create index conversations_artisan_idx on conversations(artisan_id);
create index conversations_last_msg_idx on conversations(last_message_at desc nulls last);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'artisan', 'system')),
  text text not null,
  created_at timestamptz not null default now()
);

create index messages_conv_idx on messages(conversation_id, created_at);

-- 2. Triggers

-- Quand un message est inséré, met à jour la conversation
create or replace function update_conversation_on_message()
returns trigger
language plpgsql
security definer
as $$
begin
  update conversations
  set
    last_message_text = new.text,
    last_message_at = new.created_at,
    user_unread_count = case
      when new.sender_type in ('artisan', 'system') then user_unread_count + 1
      else user_unread_count
    end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_inserted on messages;
create trigger on_message_inserted
  after insert on messages
  for each row execute function update_conversation_on_message();

-- Quand une conversation est créée, ajoute le message système de bienvenue
create or replace function create_welcome_message()
returns trigger
language plpgsql
security definer
as $$
declare
  artisan_full_name text;
  service_name text;
  booking_date_str text;
begin
  select first_name || ' ' || last_name
    into artisan_full_name
    from artisans
    where id = new.artisan_id;

  select service, to_char(booking_date, 'DD/MM') || ' à ' || booking_time
    into service_name, booking_date_str
    from bookings
    where id = new.booking_id;

  insert into messages (conversation_id, sender_type, text)
  values (
    new.id,
    'system',
    'Bonjour ! Votre demande pour « ' || service_name || ' » avec ' ||
    artisan_full_name || ' le ' || booking_date_str ||
    ' a été transmise. ' || artisan_full_name ||
    ' vous répondra dès que possible.'
  );

  return new;
end;
$$;

drop trigger if exists on_conversation_created on conversations;
create trigger on_conversation_created
  after insert on conversations
  for each row execute function create_welcome_message();

-- Quand une réservation est créée, crée la conversation
create or replace function create_conversation_for_booking()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into conversations (booking_id, user_id, artisan_id)
  values (new.id, new.user_id, new.artisan_id)
  on conflict (booking_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_booking_created_conv on bookings;
create trigger on_booking_created_conv
  after insert on bookings
  for each row execute function create_conversation_for_booking();

-- 3. RLS

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users see their own conversations"
  on conversations for select using (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on conversations for update using (auth.uid() = user_id);

create policy "Users see messages of their conversations"
  on messages for select using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );

create policy "Users send messages in their conversations"
  on messages for insert with check (
    sender_type = 'user'
    and conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );

-- 4. Realtime — active la diffusion en temps réel
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- 5. Backfill — crée les conversations pour les bookings déjà existants
insert into conversations (booking_id, user_id, artisan_id)
  select id, user_id, artisan_id
  from bookings
  on conflict (booking_id) do nothing;
