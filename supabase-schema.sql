-- =============================================
-- ACE TENNIS COACHING — Supabase SQL Schema
-- Colle ce SQL dans Supabase > SQL Editor > Run
-- =============================================

-- Table des parcs / terrains
create table parks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  color text default '#C9A84C',
  active boolean default true,
  created_at timestamptz default now()
);

-- Table des créneaux disponibles
create table slots (
  id uuid default gen_random_uuid() primary key,
  park_id uuid references parks(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes integer not null default 60,
  max_bookings integer default 1,
  notes text,
  is_blocked boolean default false,
  created_at timestamptz default now()
);

-- Table des réservations
create table bookings (
  id uuid default gen_random_uuid() primary key,
  slot_id uuid references slots(id) on delete cascade,
  client_first_name text not null,
  client_last_name text not null,
  client_email text not null,
  client_phone text,
  language text default 'fr',
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'no_show')),
  reminder_email_sent boolean default false,
  reminder_sms_sent boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Index pour les requêtes fréquentes
create index slots_date_idx on slots(date);
create index bookings_slot_id_idx on bookings(slot_id);
create index bookings_email_idx on bookings(client_email);

-- Parcs par défaut (Blainville / Montréal)
insert into parks (name, address, color) values
  ('Parc Fontainebleau', 'Blainville, QC', '#C9A84C'),
  ('Parc Jarry', '285 Rue Faillon O, Montréal', '#A07830'),
  ('Parc Lafontaine', '3933 Av. du Parc-La Fontaine, Montréal', '#C9A84C'),
  ('Complexe Claude-Robillard', '1000 Av. Émile-Journault, Montréal', '#A07830');

-- Vue utile: créneaux avec infos parc + nb de réservations
create view slots_with_details as
select
  s.*,
  p.name as park_name,
  p.address as park_address,
  p.color as park_color,
  count(b.id) filter (where b.status = 'confirmed') as booking_count
from slots s
join parks p on s.park_id = p.id
left join bookings b on b.slot_id = s.id
group by s.id, p.id;
