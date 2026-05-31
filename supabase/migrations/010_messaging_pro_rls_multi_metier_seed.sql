-- ============================================================
-- NAJDA — Migration 010 : CONSOLIDATION COMPLÈTE
-- ============================================================
-- Cette migration remplace 8 anciennes mini-migrations.
-- Elle est IDÉMPOTENTE : peut être relancée sans risque.
--
-- Contenu :
--   A. Messagerie pro (colonne pro_unread_count + trigger + RLS)
--   B. Artisans RLS pour les pros (create/update/delete leur fiche)
--   C. Bookings RLS pour les pros (voir/modifier les leurs)
--   D. Multi-métiers (colonne category_ids text[] + backfill + index)
--   E. Seed complet : 4 comptes + 3 fiches + planning + 8 bookings
--      + conversations + messages + reviews + favoris + notifications
--
-- À exécuter dans Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ============================================================
-- PARTIE A — MESSAGERIE PRO
-- ============================================================
alter table conversations
  add column if not exists pro_unread_count integer not null default 0;

create index if not exists conversations_artisan_unread_idx
  on conversations(artisan_id, pro_unread_count);

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
    end,
    pro_unread_count = case
      when new.sender_type in ('user', 'system') then pro_unread_count + 1
      else pro_unread_count
    end
  where id = new.conversation_id;
  return new;
end;
$$;

-- Backfill pro_unread_count depuis les messages existants
update conversations c set pro_unread_count = sub.cnt
from (
  select conversation_id, count(*) as cnt
  from messages
  where sender_type in ('user', 'system')
  group by conversation_id
) sub
where c.id = sub.conversation_id;

drop policy if exists "Pros see their conversations" on conversations;
create policy "Pros see their conversations" on conversations
  for select using (
    artisan_id = (select artisan_id from pro_profiles where id = auth.uid())
  );

drop policy if exists "Pros update their conversations" on conversations;
create policy "Pros update their conversations" on conversations
  for update using (
    artisan_id = (select artisan_id from pro_profiles where id = auth.uid())
  );

drop policy if exists "Pros see messages in their conversations" on messages;
create policy "Pros see messages in their conversations" on messages
  for select using (
    conversation_id in (
      select id from conversations
      where artisan_id = (select artisan_id from pro_profiles where id = auth.uid())
    )
  );

drop policy if exists "Pros send messages as artisan" on messages;
create policy "Pros send messages as artisan" on messages
  for insert with check (
    sender_type = 'artisan'
    and conversation_id in (
      select id from conversations
      where artisan_id = (select artisan_id from pro_profiles where id = auth.uid())
    )
  );


-- ============================================================
-- PARTIE B — ARTISANS RLS POUR PROS
-- ============================================================
create or replace function my_artisan_id()
returns text
language sql
stable
as $$
  select 'pro-' || substring(replace(auth.uid()::text, '-', '') from 1 for 12)
$$;

drop policy if exists "Pros insert their own artisan card" on artisans;
create policy "Pros insert their own artisan card" on artisans
  for insert with check (id = my_artisan_id());

drop policy if exists "Pros update their own artisan card" on artisans;
create policy "Pros update their own artisan card" on artisans
  for update using (id = my_artisan_id())
  with check (id = my_artisan_id());

drop policy if exists "Pros delete their own artisan card" on artisans;
create policy "Pros delete their own artisan card" on artisans
  for delete using (id = my_artisan_id());


-- ============================================================
-- PARTIE C — BOOKINGS RLS POUR PROS
-- ============================================================
drop policy if exists "Pros voient leurs bookings" on bookings;
create policy "Pros voient leurs bookings" on bookings
  for select using (auth.uid() = pro_id);

drop policy if exists "Pros mettent à jour leurs bookings" on bookings;
create policy "Pros mettent à jour leurs bookings" on bookings
  for update using (auth.uid() = pro_id);


-- ============================================================
-- PARTIE D — MULTI-MÉTIERS
-- ============================================================
alter table pro_profiles
  add column if not exists category_ids text[] not null default '{}';

alter table artisans
  add column if not exists category_ids text[] not null default '{}';

-- Backfill : copie l'ancien category_id unique dans le array
update pro_profiles
   set category_ids = array[category_id]
 where (category_ids is null or array_length(category_ids, 1) is null)
   and category_id is not null;

update artisans
   set category_ids = array[category_id]
 where (category_ids is null or array_length(category_ids, 1) is null)
   and category_id is not null;

create index if not exists artisans_categories_idx
  on artisans using gin(category_ids);

create index if not exists pro_profiles_categories_idx
  on pro_profiles using gin(category_ids);


-- ============================================================
-- PARTIE E — SEED COMPLET DE TEST
-- ============================================================
do $$
declare
  v_client_id uuid;
  v_pro1_id   uuid;  -- adoumexpert (Plomberie + Chauffage)
  v_pro2_id   uuid;  -- adoumdjibrine (Électricité)
  v_pro3_id   uuid;  -- alidjibrine (Serrurerie)

  v_art1_id text;
  v_art2_id text;
  v_art3_id text;

  v_bk_pending      uuid := gen_random_uuid();
  v_bk_accepted     uuid := gen_random_uuid();
  v_bk_in_progress  uuid := gen_random_uuid();
  v_bk_completed    uuid := gen_random_uuid();
  v_bk_reviewed1    uuid := gen_random_uuid();
  v_bk_reviewed2    uuid := gen_random_uuid();
  v_bk_rejected     uuid := gen_random_uuid();
  v_bk_cancelled    uuid := gen_random_uuid();

  v_conv_accepted    uuid;
  v_conv_in_progress uuid;
  v_conv_completed   uuid;
begin
  -- Lookup
  select id into v_client_id from auth.users where email = 'adoummhtdjibrine25@gmail.com';
  select id into v_pro1_id   from auth.users where email = 'adoumexpert@gmail.com';
  select id into v_pro2_id   from auth.users where email = 'adoumdjibrine@gmail.com';
  select id into v_pro3_id   from auth.users where email = 'alidjibrine@gmail.com';

  if v_client_id is null or v_pro1_id is null or v_pro2_id is null or v_pro3_id is null then
    raise exception 'Un des 4 comptes manque (adoummhtdjibrine25/adoumexpert/adoumdjibrine/alidjibrine). Run 999_reset_users.sql d''abord.';
  end if;

  v_art1_id := 'pro-' || substring(replace(v_pro1_id::text, '-', '') from 1 for 12);
  v_art2_id := 'pro-' || substring(replace(v_pro2_id::text, '-', '') from 1 for 12);
  v_art3_id := 'pro-' || substring(replace(v_pro3_id::text, '-', '') from 1 for 12);

  -- ============ RESET COMPLET ============
  -- 1. Tags anciens et nouveaux du seed
  delete from bookings where description like '%[SEED-010]%' or description like '%[SEED]%';

  -- 2. TOUS les bookings qui pointent vers nos 3 fiches (peu importe le tag)
  --    Cascade → supprime conversations + messages
  delete from bookings where artisan_id in (v_art1_id, v_art2_id, v_art3_id);

  -- 3. Bookings où le pro est destinataire (au cas où d'autres artisan_id pointaient)
  delete from bookings where pro_id in (v_pro1_id, v_pro2_id, v_pro3_id);

  -- 4. Bookings du client
  delete from bookings where user_id = v_client_id;

  -- 5. Reviews du seed (par auteur)
  delete from reviews where author in (
    'Ali Djibrine', 'Marie L.', 'Thomas R.', 'Julie M.',
    'Hugo B.', 'Sarah K.', 'Pierre G.', 'Catherine V.'
  );

  -- 6. Reviews qui pointent vers les 3 artisans (cascade automatique via FK)
  delete from reviews where artisan_id in (v_art1_id, v_art2_id, v_art3_id);

  -- 7. Notifications + favoris + planning
  delete from notifications
    where user_id in (v_client_id, v_pro1_id, v_pro2_id, v_pro3_id);
  delete from user_favorites where user_id = v_client_id;
  delete from artisan_availability where pro_id in (v_pro1_id, v_pro2_id, v_pro3_id);

  -- 8. Délier l'artisan_id du pro_profile (FK SET NULL)
  update pro_profiles set artisan_id = null
    where id in (v_pro1_id, v_pro2_id, v_pro3_id);

  -- 9. ENFIN supprimer les artisans (plus aucune FK ne pointe vers eux)
  delete from artisans where id in (v_art1_id, v_art2_id, v_art3_id);

  -- Profiles
  update profiles set
    role='client',
    first_name=coalesce(nullif(first_name,''),'Ali'),
    last_name=coalesce(nullif(last_name,''),'Djibrine'),
    phone=coalesce(nullif(phone,''),'06 12 34 56 78'),
    city=coalesce(nullif(city,''),'Strasbourg')
  where id=v_client_id;

  update profiles set role='pro',
    first_name=coalesce(nullif(first_name,''),'Adoum'),
    last_name=coalesce(nullif(last_name,''),'Expert'),
    phone=coalesce(nullif(phone,''),'06 11 22 33 44'),
    city=coalesce(nullif(city,''),'Strasbourg')
  where id=v_pro1_id;

  update profiles set role='pro',
    first_name=coalesce(nullif(first_name,''),'Adoum'),
    last_name=coalesce(nullif(last_name,''),'Djibrine'),
    phone=coalesce(nullif(phone,''),'06 22 33 44 55'),
    city=coalesce(nullif(city,''),'Schiltigheim')
  where id=v_pro2_id;

  update profiles set role='pro',
    first_name=coalesce(nullif(first_name,''),'Ali'),
    last_name=coalesce(nullif(last_name,''),'Djibrine'),
    phone=coalesce(nullif(phone,''),'06 33 44 55 66'),
    city=coalesce(nullif(city,''),'Strasbourg')
  where id=v_pro3_id;

  -- Artisans publiques (avec multi-métiers pour pro1)
  insert into artisans (
    id, first_name, last_name, initials, category_id, category_ids,
    rating, review_count, years_exp, distance_km, price_range,
    availability, verified, insured, bio, services,
    city, latitude, longitude, avatar_url
  ) values
  (v_art1_id,'Adoum','Expert','AE','plomberie',
   array['plomberie','chauffage'],
   4.8,47,8,1.2,'€€','now',true,true,
   'Plombier certifié + chauffagiste agréé. 8 ans d''expérience à Strasbourg. Intervention rapide, devis gratuit.',
   array['Fuite d''eau','Débouchage','Chauffe-eau','Robinetterie','Chaudière','Entretien chauffage'],
   'Strasbourg',48.5734,7.7521,
   'https://randomuser.me/api/portraits/men/45.jpg'),
  (v_art2_id,'Adoum','Djibrine','AD','electricite',
   array['electricite'],
   4.9,89,12,4.1,'€€€','today',true,true,
   'Électricien qualifié RGE. Mise aux normes, dépannage urgent, installation tableaux électriques.',
   array['Panne courant','Mise aux normes','Tableau électrique','Éclairage','Domotique'],
   'Schiltigheim',48.6087,7.7479,
   'https://randomuser.me/api/portraits/men/55.jpg'),
  (v_art3_id,'Ali','Djibrine','AD','serrurerie',
   array['serrurerie'],
   4.7,31,5,1.8,'€€','now',true,false,
   'Serrurier disponible 24/7 pour ouverture de porte, blindage et remplacement de serrure.',
   array['Ouverture porte','Changement serrure','Blindage','Coffre-fort','Cylindre'],
   'Strasbourg',48.5851,7.7508,
   'https://randomuser.me/api/portraits/men/35.jpg');

  -- Pro profiles
  insert into pro_profiles (
    id, category_id, category_ids, city, zone_km, price_range, bio,
    services, years_exp, verified, insured, accepts_emergency, active, artisan_id
  ) values
  (v_pro1_id,'plomberie',array['plomberie','chauffage'],'Strasbourg',15,'€€',
   'Plombier certifié + chauffagiste agréé. 8 ans d''expérience.',
   array['Fuite d''eau','Débouchage','Chauffe-eau','Robinetterie','Chaudière','Entretien chauffage'],
   8,true,true,true,true,v_art1_id),
  (v_pro2_id,'electricite',array['electricite'],'Schiltigheim',20,'€€€',
   'Électricien qualifié RGE.',
   array['Panne courant','Mise aux normes','Tableau électrique','Éclairage','Domotique'],
   12,true,true,false,true,v_art2_id),
  (v_pro3_id,'serrurerie',array['serrurerie'],'Strasbourg',25,'€€',
   'Serrurier disponible 24/7.',
   array['Ouverture porte','Changement serrure','Blindage','Coffre-fort','Cylindre'],
   5,true,false,true,true,v_art3_id)
  on conflict (id) do update set
    category_id=excluded.category_id,
    category_ids=excluded.category_ids,
    city=excluded.city, zone_km=excluded.zone_km, price_range=excluded.price_range,
    bio=excluded.bio, services=excluded.services, years_exp=excluded.years_exp,
    verified=excluded.verified, insured=excluded.insured,
    accepts_emergency=excluded.accepts_emergency,
    artisan_id=excluded.artisan_id, updated_at=now();

  -- Planning
  insert into artisan_availability (pro_id, day_of_week, start_time, end_time, active) values
  (v_pro1_id,1,'08:00','18:00',true),(v_pro1_id,2,'08:00','18:00',true),
  (v_pro1_id,3,'08:00','18:00',true),(v_pro1_id,4,'08:00','18:00',true),
  (v_pro1_id,5,'08:00','18:00',true),(v_pro1_id,6,'09:00','13:00',true),
  (v_pro2_id,1,'09:00','19:00',true),(v_pro2_id,2,'09:00','19:00',true),
  (v_pro2_id,3,'09:00','19:00',true),(v_pro2_id,4,'09:00','19:00',true),
  (v_pro2_id,5,'09:00','19:00',true),
  (v_pro3_id,0,'08:00','22:00',true),(v_pro3_id,1,'08:00','22:00',true),
  (v_pro3_id,2,'08:00','22:00',true),(v_pro3_id,3,'08:00','22:00',true),
  (v_pro3_id,4,'08:00','22:00',true),(v_pro3_id,5,'08:00','22:00',true),
  (v_pro3_id,6,'08:00','22:00',true);

  -- Bookings (8 statuts)
  insert into bookings (id, user_id, pro_id, artisan_id, service, booking_date, booking_time,
    description, status, price_estimate, duration_min, created_at) values
  (v_bk_pending,v_client_id,v_pro1_id,v_art1_id,
   'Fuite d''eau sous évier',current_date+1,'10:00',
   '[SEED] Fuite importante sous l''évier de cuisine. Besoin urgent.',
   'pending','80 €',90,now()-interval '2 hours'),
  (v_bk_rejected,v_client_id,v_pro3_id,v_art3_id,
   'Blindage porte',current_date+5,'09:00',
   '[SEED] Blindage suite à un cambriolage du voisin.',
   'rejected','850 €',240,now()-interval '8 hours'),
  (v_bk_cancelled,v_client_id,v_pro1_id,v_art1_id,
   'Robinet cuisine',current_date-5,'11:00',
   '[SEED] Changement robinet.','cancelled','70 €',60,now()-interval '7 days');

  insert into bookings (id, user_id, pro_id, artisan_id, service, booking_date, booking_time,
    description, status, price_estimate, duration_min, accepted_at, created_at) values
  (v_bk_accepted,v_client_id,v_pro1_id,v_art1_id,
   'Remplacement chauffe-eau',current_date+3,'14:00',
   '[SEED] Chauffe-eau 200L fuit, à remplacer.',
   'accepted','450 €',180,now()-interval '1 day',now()-interval '2 days'),
  (v_bk_in_progress,v_client_id,v_pro1_id,v_art1_id,
   'Entretien chaudière',current_date,'15:00',
   '[SEED] Entretien annuel + révision sécurité.',
   'in_progress','120 €',120,now()-interval '3 days',now()-interval '5 days');

  insert into bookings (id, user_id, pro_id, artisan_id, service, booking_date, booking_time,
    description, status, price_estimate, duration_min, accepted_at, completed_at, created_at) values
  (v_bk_completed,v_client_id,v_pro3_id,v_art3_id,
   'Ouverture porte urgence',current_date-2,'22:30',
   '[SEED] Clés oubliées, intervention rapide.',
   'completed','120 €',60,now()-interval '3 days',now()-interval '2 days',now()-interval '3 days'),
  (v_bk_reviewed1,v_client_id,v_pro1_id,v_art1_id,
   'Débouchage canalisation',current_date-10,'10:00',
   '[SEED] Canalisation salle de bain bouchée.',
   'reviewed','90 €',60,now()-interval '11 days',now()-interval '10 days',now()-interval '12 days'),
  (v_bk_reviewed2,v_client_id,v_pro2_id,v_art2_id,
   'Installation luminaires',current_date-20,'14:00',
   '[SEED] Installation 4 LED salon.',
   'reviewed','180 €',120,now()-interval '21 days',now()-interval '20 days',now()-interval '22 days');

  -- Messages enrichis dans les 3 conv principales
  select id into v_conv_accepted    from conversations where booking_id = v_bk_accepted;
  select id into v_conv_in_progress from conversations where booking_id = v_bk_in_progress;
  select id into v_conv_completed   from conversations where booking_id = v_bk_completed;

  if v_conv_accepted is not null then
    insert into messages (conversation_id, sender_type, text, created_at) values
    (v_conv_accepted,'user','Bonjour, mon chauffe-eau a une fuite importante depuis hier.',now()-interval '2 days'+interval '5 minutes'),
    (v_conv_accepted,'artisan','Bonjour, je passe demain à 14h. Devis 450€ pose et main d''œuvre comprises.',now()-interval '2 days'+interval '20 minutes'),
    (v_conv_accepted,'user','Parfait, je confirme. À demain !',now()-interval '1 day'-interval '4 hours'),
    (v_conv_accepted,'artisan','À demain 14h, je préviens 15 min avant.',now()-interval '30 minutes');
  end if;

  if v_conv_in_progress is not null then
    insert into messages (conversation_id, sender_type, text, created_at) values
    (v_conv_in_progress,'user','Vous arrivez bientôt ?',now()-interval '50 minutes'),
    (v_conv_in_progress,'artisan','Oui je suis à 20 min de chez vous.',now()-interval '45 minutes'),
    (v_conv_in_progress,'artisan','Je suis sur place, on commence !',now()-interval '15 minutes');
  end if;

  if v_conv_completed is not null then
    insert into messages (conversation_id, sender_type, text, created_at) values
    (v_conv_completed,'user','URGENT clés à l''intérieur !',now()-interval '3 days'+interval '5 minutes'),
    (v_conv_completed,'artisan','J''arrive dans 30 min max.',now()-interval '3 days'+interval '8 minutes'),
    (v_conv_completed,'user','Merci beaucoup pour votre intervention rapide !',now()-interval '2 days');
  end if;

  -- Reviews
  insert into reviews (artisan_id, author, rating, text, booking_id, user_id, created_at) values
  (v_art1_id,'Ali Djibrine',5,'Intervention au top, Adoum est arrivé en 30 minutes, très pro.',v_bk_reviewed1,v_client_id,now()-interval '10 days'),
  (v_art2_id,'Ali Djibrine',4,'Très bon travail, luminaires bien installés. Petit retard.',v_bk_reviewed2,v_client_id,now()-interval '20 days');

  insert into reviews (artisan_id, author, rating, text, created_at) values
  (v_art1_id,'Marie L.',5,'Rapide et efficace. Devis respecté.',now()-interval '15 days'),
  (v_art1_id,'Thomas R.',5,'Très bon pro, je referai appel.',now()-interval '30 days'),
  (v_art2_id,'Julie M.',5,'Travail impeccable, propre, ponctuel.',now()-interval '8 days'),
  (v_art2_id,'Hugo B.',4,'Bon dépannage, prix un peu élevé.',now()-interval '25 days'),
  (v_art3_id,'Sarah K.',5,'Sauvée à 23h un samedi soir !',now()-interval '5 days'),
  (v_art3_id,'Pierre G.',5,'Serrurier sérieux, devis honnête.',now()-interval '12 days'),
  (v_art3_id,'Catherine V.',4,'Travail soigné.',now()-interval '20 days');

  -- Sync rating + review_count
  update artisans a set
    review_count = sub.cnt,
    rating = round(sub.avg_rating, 1)
  from (
    select artisan_id, count(*) as cnt, avg(rating)::numeric(3,1) as avg_rating
    from reviews where artisan_id in (v_art1_id,v_art2_id,v_art3_id)
    group by artisan_id
  ) sub where a.id = sub.artisan_id;

  -- Favoris
  insert into user_favorites (user_id, artisan_id) values
  (v_client_id, v_art1_id),
  (v_client_id, v_art2_id),
  (v_client_id, v_art3_id);

  -- Notifications client
  insert into notifications (user_id, type, title, body, data, read, created_at) values
  (v_client_id,'booking_accepted','Demande acceptée',
   'Adoum Expert a accepté votre demande de remplacement de chauffe-eau.',
   jsonb_build_object('booking_id',v_bk_accepted),false,now()-interval '1 day'),
  (v_client_id,'review_request','Donnez votre avis',
   'Comment s''est passée votre intervention avec Ali Djibrine ?',
   jsonb_build_object('booking_id',v_bk_completed),false,now()-interval '2 days'),
  (v_client_id,'new_message','Nouveau message',
   'Adoum Expert vous a envoyé un message.',
   jsonb_build_object('conversation_id',v_conv_in_progress),false,now()-interval '15 minutes'),
  (v_client_id,'booking_rejected','Demande refusée',
   'Ali Djibrine n''est pas disponible pour votre blindage.',
   jsonb_build_object('booking_id',v_bk_rejected),true,now()-interval '6 hours'),
  (v_client_id,'system','Bienvenue sur Najda',
   'Découvrez nos artisans vérifiés près de chez vous.',
   '{}'::jsonb,true,now()-interval '7 days');

  raise notice 'SEED OK : 3 artisans (dont 1 multi-métier), 8 bookings, 8 conversations, 18 messages, 9 avis, 3 favoris, 5 notifications';
end $$;

-- Diagnostic final
select
  u.email,
  p.role,
  pp.category_ids as metiers,
  pp.artisan_id,
  (select count(*) from bookings where pro_id=u.id) as bookings_recus,
  (select count(*) from bookings where pro_id=u.id and status='pending') as pending,
  (select count(*) from bookings where pro_id=u.id and status in ('accepted','in_progress')) as actifs
from auth.users u
left join profiles p on p.id=u.id
left join pro_profiles pp on pp.id=u.id
where p.role='pro'
order by u.email;
