-- ============================================================
-- NAJDA — Migration 006 : artisans à Strasbourg et grande couronne
-- ============================================================
-- Ajoute 12 artisans répartis sur Strasbourg, Bischheim, Hoenheim,
-- Schiltigheim, Illkirch — pour tester le filtre par proximité.
--
-- Coordonnées GPS réelles :
--   Strasbourg centre   : 48.5734, 7.7521
--   Bischheim           : 48.6122, 7.7522
--   Hoenheim            : 48.6172, 7.7531
--   Schiltigheim        : 48.6019, 7.7464
--   Illkirch            : 48.5269, 7.7222
-- ============================================================

-- ===== STRASBOURG CENTRE (3 artisans) =====
insert into artisans (
  id, first_name, last_name, initials, category_id,
  rating, review_count, years_exp, distance_km, price_range,
  availability, verified, insured, bio, services,
  city, latitude, longitude, avatar_url
) values
(
  'stra-p1', 'Lucas', 'Schneider', 'LS', 'plomberie',
  4.9, 142, 11, 0.3, '€€',
  'now', true, true,
  'Plombier diplômé à Strasbourg. Intervention rapide en centre-ville et Krutenau.',
  '{Fuite d''eau, Débouchage, Chauffe-eau, Robinetterie, Salle de bain}',
  'Strasbourg', 48.5734, 7.7521,
  'https://randomuser.me/api/portraits/men/22.jpg'
),
(
  'stra-s1', 'Élise', 'Muller', 'EM', 'serrurerie',
  4.8, 98, 8, 0.5, '€€',
  'now', true, true,
  'Serrurière agréée assurances, dépannage 7j/7 à Strasbourg centre.',
  '{Ouverture de porte, Changement serrure, Blindage, Digicode}',
  'Strasbourg', 48.5810, 7.7480,
  'https://randomuser.me/api/portraits/women/31.jpg'
),
(
  'stra-e1', 'Antoine', 'Klein', 'AK', 'electricite',
  4.7, 76, 14, 0.8, '€€€',
  'today', true, true,
  'Électricien certifié Qualifelec. Mise aux normes et domotique.',
  '{Panne électrique, Tableau, Prises, Mise aux normes, Domotique}',
  'Strasbourg', 48.5700, 7.7600,
  'https://randomuser.me/api/portraits/men/56.jpg'
)
on conflict (id) do nothing;

-- ===== BISCHHEIM (3 artisans) =====
insert into artisans (
  id, first_name, last_name, initials, category_id,
  rating, review_count, years_exp, distance_km, price_range,
  availability, verified, insured, bio, services,
  city, latitude, longitude, avatar_url
) values
(
  'bis-ch1', 'Marc', 'Bauer', 'MB', 'chauffage',
  4.9, 187, 18, 5.0, '€€',
  'now', true, true,
  'Chauffagiste à Bischheim, spécialiste pompes à chaleur et chaudières gaz.',
  '{Entretien chaudière, Panne chauffage, Pompe à chaleur, Radiateurs}',
  'Bischheim', 48.6122, 7.7522,
  'https://randomuser.me/api/portraits/men/41.jpg'
),
(
  'bis-pe1', 'Sophie', 'Weber', 'SW', 'peinture',
  4.6, 64, 9, 5.2, '€€',
  'tomorrow', true, true,
  'Peintre en bâtiment, finitions soignées, intérieur et extérieur.',
  '{Peinture intérieure, Peinture extérieure, Enduit décoratif, Papier peint}',
  'Bischheim', 48.6160, 7.7540,
  'https://randomuser.me/api/portraits/women/52.jpg'
),
(
  'bis-p1', 'Julien', 'Vogel', 'JV', 'plomberie',
  4.7, 89, 7, 5.5, '€',
  'today', true, true,
  'Plombier de quartier à Bischheim. Petits dépannages et installation.',
  '{Fuite d''eau, Débouchage, Robinet, WC}',
  'Bischheim', 48.6090, 7.7500,
  'https://randomuser.me/api/portraits/men/29.jpg'
)
on conflict (id) do nothing;

-- ===== HOENHEIM (2 artisans) =====
insert into artisans (
  id, first_name, last_name, initials, category_id,
  rating, review_count, years_exp, distance_km, price_range,
  availability, verified, insured, bio, services,
  city, latitude, longitude, avatar_url
) values
(
  'hoe-me1', 'Patrick', 'Wagner', 'PW', 'menuiserie',
  4.8, 112, 22, 6.0, '€€€',
  'week', true, true,
  'Menuisier ébéniste à Hoenheim. Cuisines sur mesure et escaliers.',
  '{Cuisine sur mesure, Placards, Escaliers, Portes}',
  'Hoenheim', 48.6172, 7.7531,
  'https://randomuser.me/api/portraits/men/64.jpg'
),
(
  'hoe-j1', 'Camille', 'Roth', 'CR', 'jardinage',
  4.7, 73, 6, 6.3, '€',
  'tomorrow', true, true,
  'Jardinière paysagiste à Hoenheim. Entretien et création.',
  '{Tonte pelouse, Taille haies, Élagage, Plantation, Aménagement}',
  'Hoenheim', 48.6200, 7.7560,
  'https://randomuser.me/api/portraits/women/38.jpg'
)
on conflict (id) do nothing;

-- ===== SCHILTIGHEIM (2 artisans) =====
insert into artisans (
  id, first_name, last_name, initials, category_id,
  rating, review_count, years_exp, distance_km, price_range,
  availability, verified, insured, bio, services,
  city, latitude, longitude, avatar_url
) values
(
  'sch-s1', 'Thomas', 'Becker', 'TB', 'serrurerie',
  4.9, 154, 12, 3.5, '€€',
  'now', true, true,
  'Serrurier à Schiltigheim, certifié A2P. Dépannage urgences.',
  '{Ouverture de porte, Changement serrure, Cylindre, Serrure connectée}',
  'Schiltigheim', 48.6019, 7.7464,
  'https://randomuser.me/api/portraits/men/73.jpg'
),
(
  'sch-cl1', 'Hugo', 'Fischer', 'HF', 'climatisation',
  4.6, 58, 8, 3.7, '€€€',
  'today', true, true,
  'Frigoriste à Schiltigheim. Installation et entretien clim.',
  '{Installation clim, Entretien, Dépannage, Clim réversible}',
  'Schiltigheim', 48.6050, 7.7500,
  'https://randomuser.me/api/portraits/men/47.jpg'
)
on conflict (id) do nothing;

-- ===== ILLKIRCH (2 artisans, plus loin pour tester le rayon) =====
insert into artisans (
  id, first_name, last_name, initials, category_id,
  rating, review_count, years_exp, distance_km, price_range,
  availability, verified, insured, bio, services,
  city, latitude, longitude, avatar_url
) values
(
  'ill-ca1', 'David', 'Hartmann', 'DH', 'carrelage',
  4.5, 47, 15, 8.0, '€€',
  'week', false, true,
  'Carreleur à Illkirch. Salles de bain et terrasses extérieures.',
  '{Carrelage sol, Carrelage mural, Faïence, Terrasse extérieure}',
  'Illkirch', 48.5269, 7.7222,
  'https://randomuser.me/api/portraits/men/82.jpg'
),
(
  'ill-ma1', 'Bruno', 'Reinhardt', 'BR', 'maconnerie',
  4.4, 32, 20, 8.5, '€€€',
  'week', true, true,
  'Maçon à Illkirch. Murs, terrasses, ravalements de façade.',
  '{Murs, Fondations, Terrasses, Extension, Ravalement}',
  'Illkirch', 48.5300, 7.7250,
  'https://randomuser.me/api/portraits/men/95.jpg'
)
on conflict (id) do nothing;
