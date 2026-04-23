-- =====================================================================
-- Amigos Itubers Roles — schema completo pro app
-- Tabelas: app_profiles, app_places, app_roles
-- Sem auth do Supabase (o app usa nome + código do grupo no client)
-- =====================================================================

create extension if not exists pgcrypto;

-- ── PROFILES ─────────────────────────────────────────────────────────

create table if not exists public.app_profiles (
  name text primary key,
  display_name text not null default '',
  nickname text not null default '',
  photo_url text not null default '',
  birth_date date null,
  city text not null default '',
  neighborhood text not null default '',
  address text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

-- Semeia os 6 membros do grupo se ainda não existirem.
insert into public.app_profiles (name, display_name, nickname, city)
values
  ('filipe', 'Filipe', 'Filipe', 'São Paulo'),
  ('victor', 'Victor', 'Victor', 'São Paulo'),
  ('larissa', 'Larissa', 'Larissa', 'São Paulo'),
  ('gustavo', 'Gustavo', 'Gustavo', 'São Paulo'),
  ('bruno', 'Bruno', 'Bruno', 'São Paulo'),
  ('ricardo', 'Ricardo', 'Ricardo', 'São Paulo')
on conflict (name) do nothing;

-- ── PLACES ───────────────────────────────────────────────────────────

create table if not exists public.app_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  neighborhood text not null default '',
  address text not null default '',
  photo_url text not null default '',
  added_by text not null references public.app_profiles (name) on delete set default default 'filipe',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_places_created_at_idx
  on public.app_places (created_at desc);

-- ── ROLES ────────────────────────────────────────────────────────────

create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  place_id uuid null references public.app_places (id) on delete set null,
  date date not null,
  suggested_by text not null references public.app_profiles (name) on delete set default default 'filipe',
  description text not null default '',
  stage text not null default 'suggested' check (stage in ('suggested', 'confirmed', 'done')),
  confirmations text[] not null default array[]::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_roles_date_idx
  on public.app_roles (date);

create index if not exists app_roles_stage_idx
  on public.app_roles (stage);

-- Trigger pra manter updated_at em app_roles e app_profiles.
create or replace function public.app_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_app_profiles_updated_at on public.app_profiles;
create trigger trg_app_profiles_updated_at
before update on public.app_profiles
for each row execute function public.app_set_updated_at();

drop trigger if exists trg_app_roles_updated_at on public.app_roles;
create trigger trg_app_roles_updated_at
before update on public.app_roles
for each row execute function public.app_set_updated_at();

-- ── PERMISSÕES ───────────────────────────────────────────────────────
-- App usa somente o anon key. Liberamos CRUD público pras 3 tabelas.
-- Grupo de 6 amigos — baixa sensibilidade. Restrição fica no client.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.app_profiles to anon, authenticated;
grant select, insert, update, delete on public.app_places to anon, authenticated;
grant select, insert, update, delete on public.app_roles to anon, authenticated;

alter table public.app_profiles enable row level security;
alter table public.app_places   enable row level security;
alter table public.app_roles    enable row level security;

drop policy if exists "app_profiles_all" on public.app_profiles;
create policy "app_profiles_all"
on public.app_profiles for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "app_places_all" on public.app_places;
create policy "app_places_all"
on public.app_places for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "app_roles_all" on public.app_roles;
create policy "app_roles_all"
on public.app_roles for all
to anon, authenticated
using (true)
with check (true);
