-- ============================================================
-- Squawk — Supabase Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

-- USERS
create table if not exists public.users (
  id                  integer primary key,
  clerk_id            text not null unique,
  username            text not null unique,
  display_name        text not null,
  bio                 text,
  avatar_url          text,
  cover_url           text,
  website             text,
  is_verified         boolean not null default false,
  is_founder          boolean not null default false,
  is_founder_verified boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- POSTS
create table if not exists public.posts (
  id            integer primary key,
  author_id     integer not null references public.users(id) on delete cascade,
  caption       text,
  media_url     text not null,
  media_type    text not null check (media_type in ('image', 'video')),
  thumbnail_url text,
  hashtags      text[] not null default '{}',
  views_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- CHIRPS
create table if not exists public.chirps (
  id             integer primary key,
  author_id      integer not null references public.users(id) on delete cascade,
  content        text not null,
  hashtags       text[] not null default '{}',
  mentions       text[] not null default '{}',
  media_url      text,
  media_type     text,
  parent_id      integer references public.chirps(id) on delete set null,
  rechirp_of_id  integer references public.chirps(id) on delete set null,
  quote_of_id    integer references public.chirps(id) on delete set null,
  view_count     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists chirps_author_id_idx on public.chirps(author_id);
create index if not exists chirps_created_at_idx on public.chirps(created_at desc);
create index if not exists chirps_parent_id_idx on public.chirps(parent_id);

-- Enable Row Level Security (recommended)
alter table public.users  enable row level security;
alter table public.posts  enable row level security;
alter table public.chirps enable row level security;

-- Allow service role full access (used by the API server)
create policy "Service role full access - users"
  on public.users for all
  using (true)
  with check (true);

create policy "Service role full access - posts"
  on public.posts for all
  using (true)
  with check (true);

create policy "Service role full access - chirps"
  on public.chirps for all
  using (true)
  with check (true);

-- Allow public read access
create policy "Public read - users"
  on public.users for select
  using (true);

create policy "Public read - posts"
  on public.posts for select
  using (true);

create policy "Public read - chirps"
  on public.chirps for select
  using (true);
