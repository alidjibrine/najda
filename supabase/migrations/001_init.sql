-- ============================================================
-- NAJDA — Schéma initial de la base de données
-- ============================================================
-- Ce fichier crée toutes les tables, policies de sécurité (RLS),
-- triggers et données de démonstration de Najda.
--
-- ⚠️ ATTENTION : ce script utilise `drop table if exists ... cascade`
-- ce qui supprime les données existantes. À n'exécuter que sur une
-- base vide ou de développement.
-- ============================================================

-- =========================
-- TABLES
-- =========================

drop table if exists bookings cascade;
drop table if exists reviews cascade;
drop table if exists artisans cascade;
drop table if exists categories cascade;
drop table if exists profiles cascade;

-- Catégories de services
create table categories (
  id text primary key,
  name text not null,
  subtitle text,
  icon text not null,
  color_bg_from text not null,
  color_bg_to text not null,
  color_icon text not null default '#FFFFFF',
  is_urgent boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Artisans
create table artisans (
  id text primary key,
  first_name text not null,
  last_name text not null,
  initials text not null,
  category_id text not null references categories(id),
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  years_exp integer not null default 0,
  distance_km numeric(4,1) not null default 0,
  price_range text,
  availability text not null check (availability in ('now', 'today', 'tomorrow', 'week')),
  verified boolean not null default false,
  insured boolean not null default false,
  bio text,
  services text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index artisans_category_idx on artisans(category_id);
create index artisans_availability_idx on artisans(availability);

-- Avis clients
create table reviews (
  id uuid primary key default gen_random_uuid(),
  artisan_id text not null references artisans(id) on delete cascade,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now()
);

create index reviews_artisan_idx on reviews(artisan_id);

-- Profils utilisateurs (lié à auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Réservations
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artisan_id text not null references artisans(id),
  service text not null,
  booking_date date not null,
  booking_time text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  price_estimate text,
  acompte numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_user_idx on bookings(user_id);
create index bookings_status_idx on bookings(status);
create index bookings_date_idx on bookings(booking_date);

-- =========================
-- TRIGGERS
-- =========================

-- Auto-création du profil quand un user s'inscrit
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update du champ updated_at
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at_column();

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table categories enable row level security;
alter table artisans enable row level security;
alter table reviews enable row level security;
alter table profiles enable row level security;
alter table bookings enable row level security;

-- Catégories : lecture publique
create policy "Categories sont publiques"
  on categories for select using (true);

-- Artisans : lecture publique
create policy "Artisans sont publics"
  on artisans for select using (true);

-- Reviews : lecture publique
create policy "Reviews sont publics"
  on reviews for select using (true);

-- Profils : chaque user voit/modifie le sien
create policy "Lecture de son propre profil"
  on profiles for select using (auth.uid() = id);

create policy "Modification de son propre profil"
  on profiles for update using (auth.uid() = id);

create policy "Création de son propre profil"
  on profiles for insert with check (auth.uid() = id);

-- Bookings : chaque user voit/crée/modifie les siens
create policy "Lecture de ses propres RDV"
  on bookings for select using (auth.uid() = user_id);

create policy "Création de ses propres RDV"
  on bookings for insert with check (auth.uid() = user_id);

create policy "Modification de ses propres RDV"
  on bookings for update using (auth.uid() = user_id);

create policy "Suppression de ses propres RDV"
  on bookings for delete using (auth.uid() = user_id);

-- =========================
-- SEED DATA
-- =========================

-- Catégories
insert into categories (id, name, subtitle, icon, color_bg_from, color_bg_to, color_icon, is_urgent, sort_order) values
('plomberie', 'Plomberie', 'Fuites · Robinets · Canalisations', 'water', '#3B82F6', '#1D4ED8', '#FFFFFF', true, 1),
('serrurerie', 'Serrurerie', 'Portes · Serrures · Blindage', 'key', '#EF4444', '#B91C1C', '#FFFFFF', true, 2),
('electricite', 'Électricité', 'Pannes · Prises · Tableaux', 'flash', '#F59E0B', '#B45309', '#FFFFFF', true, 3),
('chauffage', 'Chauffage', 'Chaudières · Radiateurs', 'flame', '#F97316', '#C2410C', '#FFFFFF', true, 4),
('peinture', 'Peinture', 'Intérieur · Extérieur', 'color-palette-outline', '#EDE9FE', '#EDE9FE', '#6D28D9', false, 5),
('menuiserie', 'Menuiserie', 'Portes · Fenêtres', 'hammer-outline', '#FDF9EE', '#FDF9EE', '#A88F3E', false, 6),
('maconnerie', 'Maçonnerie', 'Murs · Terrasses', 'cube-outline', '#F3F4F6', '#F3F4F6', '#374151', false, 7),
('carrelage', 'Carrelage', 'Sols · Murs', 'grid-outline', '#D1FAE5', '#D1FAE5', '#047857', false, 8),
('climatisation', 'Climatisation', 'Installation · Entretien', 'snow-outline', '#E0F2FE', '#E0F2FE', '#0369A1', false, 9),
('jardinage', 'Jardinage', 'Entretien · Élagage', 'leaf-outline', '#DCFCE7', '#DCFCE7', '#15803D', false, 10);

-- Artisans
insert into artisans (id, first_name, last_name, initials, category_id, rating, review_count, years_exp, distance_km, price_range, availability, verified, insured, bio, services) values
('p1', 'Marc', 'Dubois', 'MD', 'plomberie', 4.9, 234, 12, 1.2, '60 – 180 €', 'now', true, true, 'Plombier indépendant depuis 12 ans, spécialisé dans le dépannage urgent et la rénovation de salles de bain. Intervention rapide, travail soigné.', array['Fuite d''eau', 'Débouchage', 'Chauffe-eau', 'Robinetterie', 'Salle de bain']),
('p2', 'Sofia', 'Kessler', 'SK', 'plomberie', 4.8, 156, 8, 2.1, '70 – 200 €', 'today', true, true, 'Plombière qualifiée RGE. Spécialiste des installations éco-responsables et du remplacement de chauffe-eau thermodynamiques.', array['Installation sanitaire', 'Chauffe-eau', 'Économies d''eau', 'Dépannage']),
('p3', 'Julien', 'Perrin', 'JP', 'plomberie', 4.7, 89, 5, 3.4, '55 – 150 €', 'tomorrow', true, true, 'Jeune plombier dynamique. Dépannage rapide et installation neuve. Devis gratuit sous 24h.', array['Dépannage urgent', 'Débouchage', 'Fuite', 'WC', 'Robinet']),
('s1', 'Antoine', 'Bernard', 'AB', 'serrurerie', 4.9, 312, 15, 0.8, '80 – 250 €', 'now', true, true, 'Serrurier agréé, intervention en 30 min. Ouverture de porte, changement de serrure, blindage. Tarifs affichés, pas de mauvaise surprise.', array['Ouverture de porte', 'Changement serrure', 'Blindage', 'Digicode', 'Cylindre']),
('s2', 'Nadia', 'Hamidi', 'NH', 'serrurerie', 4.8, 178, 10, 1.9, '90 – 280 €', 'today', true, true, 'Serrurière spécialisée en sécurité haute gamme. Installation de serrures connectées et blindage de portes.', array['Serrure connectée', 'Blindage', 'Installation', 'Dépannage', 'Coffre-fort']),
('e1', 'Karim', 'Benali', 'KB', 'electricite', 4.9, 267, 14, 1.5, '70 – 200 €', 'now', true, true, 'Électricien certifié Qualifelec. Dépannage, mise en conformité, installation complète. Devis gratuit.', array['Panne électrique', 'Tableau', 'Prises', 'Éclairage', 'Mise aux normes']),
('e2', 'Claire', 'Fontaine', 'CF', 'electricite', 4.7, 98, 6, 2.8, '65 – 180 €', 'tomorrow', true, true, 'Électricienne spécialisée domotique et éclairage LED. Installation neuve et rénovation.', array['Domotique', 'LED', 'Installation neuve', 'Rénovation', 'Interrupteurs']),
('ch1', 'Philippe', 'Martin', 'PM', 'chauffage', 4.8, 198, 18, 2.0, '80 – 300 €', 'today', true, true, 'Chauffagiste RGE qualifié. Entretien, dépannage et remplacement de chaudières gaz et fioul. Pompes à chaleur.', array['Entretien chaudière', 'Panne chauffage', 'Pompe à chaleur', 'Radiateurs', 'Plancher chauffant']),
('pe1', 'Alexandre', 'Roux', 'AR', 'peinture', 4.9, 145, 11, 3.2, '40 – 60 €/m²', 'week', true, true, 'Peintre décorateur professionnel. Intérieur et extérieur, enduits décoratifs, papier peint. Finitions soignées.', array['Peinture intérieure', 'Peinture extérieure', 'Papier peint', 'Enduit décoratif', 'Laque']),
('me1', 'Laurent', 'Chevalier', 'LC', 'menuiserie', 4.8, 112, 20, 4.1, 'Sur devis', 'week', true, true, 'Menuisier ébéniste, fabrication et pose de cuisines, placards et escaliers sur mesure. Bois massif et dérivés.', array['Cuisine sur mesure', 'Placards', 'Escaliers', 'Portes', 'Fenêtres bois']),
('ma1', 'Youssef', 'Amrani', 'YA', 'maconnerie', 4.7, 76, 16, 5.0, 'Sur devis', 'week', true, true, 'Maçon qualifié, construction et rénovation. Murs, fondations, terrasses, extensions. Devis détaillé gratuit.', array['Murs', 'Fondations', 'Terrasses', 'Extension', 'Ravalement']),
('ca1', 'Roberto', 'Silva', 'RS', 'carrelage', 4.9, 134, 13, 2.5, '45 – 70 €/m²', 'tomorrow', true, true, 'Carreleur mosaïste, pose de tous types de carrelage. Salle de bain, cuisine, terrasse. Découpes complexes maîtrisées.', array['Carrelage sol', 'Carrelage mural', 'Mosaïque', 'Faïence', 'Terrasse extérieure']),
('cl1', 'Fabien', 'Girard', 'FG', 'climatisation', 4.8, 92, 9, 3.0, '100 – 400 €', 'today', true, true, 'Climaticien certifié. Installation, entretien et dépannage de climatisations réversibles. Devis personnalisé.', array['Installation clim', 'Entretien', 'Dépannage', 'Clim réversible', 'Gainable']),
('j1', 'Élodie', 'Mercier', 'EM', 'jardinage', 4.7, 67, 7, 4.5, '35 – 55 €/h', 'tomorrow', true, true, 'Jardinière paysagiste, entretien et création de jardins. Taille, tonte, plantations, aménagement paysager.', array['Tonte pelouse', 'Taille haies', 'Élagage', 'Plantation', 'Aménagement']);

-- Avis clients
insert into reviews (artisan_id, author, rating, text, created_at) values
('p1', 'Claire M.', 5, 'Intervention rapide et propre. Prix très correct.', now() - interval '3 days'),
('p1', 'Thomas L.', 5, 'Excellent travail sur ma salle de bain. Je recommande.', now() - interval '1 week'),
('p1', 'Sophie B.', 4, 'Bon professionnel, ponctuel et efficace.', now() - interval '2 weeks'),
('p2', 'Paul R.', 5, 'Très professionnelle, bons conseils sur l''installation.', now() - interval '5 days'),
('p2', 'Marie D.', 5, 'Travail impeccable et tarif transparent.', now() - interval '2 weeks'),
('p3', 'Emma V.', 5, 'Rapide et pas cher. Super service.', now() - interval '1 week'),
('s1', 'Lucas P.', 5, 'Porte ouverte en 20 min sans dégât. Tarif honnête.', now() - interval '2 days'),
('s1', 'Julie G.', 5, 'Très rassurant et professionnel. Merci !', now() - interval '1 week'),
('s2', 'Pierre C.', 5, 'Installation parfaite de ma serrure connectée.', now() - interval '4 days'),
('e1', 'Sarah M.', 5, 'Panne réglée en 1h. Très compétent.', now() - interval '3 days'),
('e1', 'David K.', 5, 'Mise aux normes de mon tableau, travail nickel.', now() - interval '2 weeks'),
('e2', 'Léa T.', 5, 'Super installation domotique. Très à l''écoute.', now() - interval '1 week'),
('ch1', 'François D.', 5, 'Entretien annuel parfait, très ponctuel.', now() - interval '5 days'),
('ch1', 'Isabelle R.', 5, 'Remplacement chaudière rapide et propre.', now() - interval '3 weeks'),
('pe1', 'Camille L.', 5, 'Finitions impeccables, un vrai artiste.', now() - interval '1 week'),
('me1', 'Marine S.', 5, 'Cuisine magnifique, travail d''orfèvre.', now() - interval '2 weeks'),
('ma1', 'Jean-Pierre M.', 5, 'Terrasse parfaite, chantier propre.', now() - interval '3 weeks'),
('ca1', 'Anne G.', 5, 'Salle de bain sublimée. Travail de précision.', now() - interval '1 week'),
('cl1', 'Stéphane B.', 5, 'Installation clim parfaite, fait en 2h.', now() - interval '4 days'),
('j1', 'Patrick V.', 5, 'Jardin transformé, très créative.', now() - interval '2 weeks');

-- Création des profils pour les utilisateurs existants (au cas où)
insert into profiles (id)
  select id from auth.users
  on conflict do nothing;
