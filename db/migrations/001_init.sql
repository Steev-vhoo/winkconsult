-- WiNK CONSULT: initial schema. Safe to paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- Staff accounts ---------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null default 'staff' check (role in ('admin', 'staff')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  id          text primary key,              -- sha256 of the cookie token
  user_id     uuid not null references users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);

create table if not exists login_attempts (
  id          bigserial primary key,
  email       text not null,
  ip_hash     text not null,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists login_attempts_recent_idx on login_attempts(created_at);

-- Site content -----------------------------------------------------------
create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  icon              text not null default 'shield',
  summary           text not null default '',
  body_md           text not null default '',
  whatsapp_message  text not null default '',
  category          text not null default 'core' check (category in ('core', 'partner')),
  tile_label        text not null default '',
  sort_order        int not null default 0,
  published         boolean not null default true,
  updated_at        timestamptz not null default now()
);

create table if not exists faqs (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  question    text not null,
  answer_md   text not null,
  sort_order  int not null default 0,
  published   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  body_md       text not null default '',
  cover_url     text,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  author_id     uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_published_idx on posts(status, published_at desc);

-- Leads ------------------------------------------------------------------
create table if not exists enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null default '',
  email       text not null default '',
  location    text not null default '',
  service     text not null default '',
  message     text not null default '',
  status      text not null default 'new' check (status in ('new', 'in_progress', 'done', 'archived')),
  notes       text not null default '',
  ip_hash     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists enquiries_status_idx on enquiries(status, created_at desc);

create table if not exists classes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  kind         text not null default 'IELTS',
  description  text not null default '',
  start_date   date,
  schedule     text not null default '',
  mode         text not null default 'Online' check (mode in ('Online', 'In person', 'Hybrid')),
  location     text not null default '',
  capacity     int not null default 20 check (capacity >= 0),
  price        text not null default '',
  status       text not null default 'open' check (status in ('open', 'closed')),
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('class', 'consultation')),
  class_id        uuid references classes(id) on delete set null,
  name            text not null,
  phone           text not null,
  email           text not null default '',
  preferred_date  date,
  preferred_time  text not null default '',
  topic           text not null default '',
  message         text not null default '',
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes           text not null default '',
  ip_hash         text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists bookings_status_idx on bookings(status, created_at desc);
create index if not exists bookings_class_idx on bookings(class_id);

-- The app connects with the database owner role; lock tables away from
-- Supabase's public API roles (anon / authenticated) as defence in depth.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'alter table users enable row level security';
    execute 'alter table sessions enable row level security';
    execute 'alter table login_attempts enable row level security';
    execute 'alter table settings enable row level security';
    execute 'alter table services enable row level security';
    execute 'alter table faqs enable row level security';
    execute 'alter table posts enable row level security';
    execute 'alter table enquiries enable row level security';
    execute 'alter table classes enable row level security';
    execute 'alter table bookings enable row level security';
  end if;
end $$;
