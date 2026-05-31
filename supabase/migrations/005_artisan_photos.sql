-- ============================================================
-- NAJDA — Migration 005 : photos de profil des artisans
-- ============================================================
-- Ajoute la colonne avatar_url et peuple les artisans démo
-- avec des photos provenant de randomuser.me (libre de droits).
-- ============================================================

alter table artisans add column if not exists avatar_url text;

update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/32.jpg' where id = 'p1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/women/44.jpg' where id = 'p2';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/19.jpg' where id = 'p3';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/46.jpg' where id = 's1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/women/68.jpg' where id = 's2';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/52.jpg' where id = 'e1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/women/26.jpg' where id = 'e2';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/65.jpg' where id = 'ch1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/41.jpg' where id = 'pe1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/72.jpg' where id = 'me1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/58.jpg' where id = 'ma1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/85.jpg' where id = 'ca1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/men/77.jpg' where id = 'cl1';
update artisans set avatar_url = 'https://randomuser.me/api/portraits/women/55.jpg' where id = 'j1';
