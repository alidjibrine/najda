-- ============================================================
-- NAJDA — Migration 004 : géolocalisation des artisans
-- ============================================================
-- Ajoute :
--   1. Colonnes city, latitude, longitude à artisans
--   2. Coordonnées mock dans la région Lyonnaise pour la démo
-- ============================================================

alter table artisans
  add column if not exists city text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- Tous les artisans démo sont autour de Lyon pour la démo
-- Centre Lyon : 45.7640, 4.8357
-- Offsets aléatoires dans un rayon de ~2 km

update artisans set
  city = 'Lyon',
  latitude = 45.7640 + (random() - 0.5) * 0.04,
  longitude = 4.8357 + (random() - 0.5) * 0.04
where latitude is null;

-- Forcer certains artisans à des positions identifiables (pour la cohérence des distances mock)
update artisans set latitude = 45.7570, longitude = 4.8420 where id = 'p1';
update artisans set latitude = 45.7720, longitude = 4.8290 where id = 'p2';
update artisans set latitude = 45.7505, longitude = 4.8510 where id = 'p3';
update artisans set latitude = 45.7600, longitude = 4.8200 where id = 's1';
update artisans set latitude = 45.7800, longitude = 4.8450 where id = 's2';
update artisans set latitude = 45.7650, longitude = 4.8550 where id = 'e1';
update artisans set latitude = 45.7480, longitude = 4.8300 where id = 'e2';
update artisans set latitude = 45.7700, longitude = 4.8400 where id = 'ch1';
update artisans set latitude = 45.7820, longitude = 4.8530 where id = 'pe1';
update artisans set latitude = 45.7400, longitude = 4.8200 where id = 'me1';
update artisans set latitude = 45.7350, longitude = 4.8600 where id = 'ma1';
update artisans set latitude = 45.7900, longitude = 4.8350 where id = 'ca1';
update artisans set latitude = 45.7550, longitude = 4.8100 where id = 'cl1';
update artisans set latitude = 45.7950, longitude = 4.8480 where id = 'j1';
