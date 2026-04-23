create extension if not exists pgcrypto;

create table if not exists public.role_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'outro' check (
    category in (
      'restaurante',
      'bar',
      'show',
      'cinema',
      'cafe',
      'bate_volta',
      'viagem',
      'outro'
    )
  ),
  status text not null default 'planned' check (
    status in ('planned', 'done', 'canceled')
  ),
  place text not null default '',
  city text not null default '',
  neighborhood text not null default '',
  start_at timestamptz not null,
  end_at timestamptz null,
  note text not null default '',
  vibe text not null default '',
  suggestion_owner text not null default 'os_dois' check (
    suggestion_owner in ('voce', 'marido', 'os_dois')
  ),
  suggested_by text not null default '',
  role_type text not null default '',
  price_band text not null default '$$',
  stage text not null default 'suggested',
  cover_label text not null default 'AY',
  rating smallint null check (rating between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.role_entries
  add column if not exists suggested_by text not null default '';

alter table public.role_entries
  add column if not exists role_type text not null default '';

alter table public.role_entries
  add column if not exists price_band text not null default '$$';

alter table public.role_entries
  add column if not exists stage text not null default 'suggested';

alter table public.role_entries
  add column if not exists cover_label text not null default 'AY';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'role_entries_stage_check'
  ) then
    alter table public.role_entries
      add constraint role_entries_stage_check
      check (stage in ('suggested', 'voting', 'chosen', 'done', 'canceled'));
  end if;
end
$$;

update public.role_entries
set
  suggested_by = case suggestion_owner
    when 'voce' then 'Filipe'
    when 'marido' then 'Victor'
    else 'Grupo'
  end
where coalesce(trim(suggested_by), '') = '';

update public.role_entries
set role_type = case
  when category = 'restaurante' then 'jantar'
  else category
end
where coalesce(trim(role_type), '') = '';

update public.role_entries
set price_band = '$$'
where coalesce(trim(price_band), '') = '';

update public.role_entries
set stage = case status
  when 'done' then 'done'
  when 'canceled' then 'canceled'
  else 'suggested'
end
where coalesce(trim(stage), '') = '';

update public.role_entries
set cover_label = upper(left(regexp_replace(title, '[^A-Za-z0-9]', '', 'g'), 2))
where coalesce(trim(cover_label), '') = '';

create index if not exists role_entries_status_start_at_idx
  on public.role_entries (status, start_at desc);

create index if not exists role_entries_created_at_idx
  on public.role_entries (created_at desc);

create index if not exists role_entries_stage_start_at_idx
  on public.role_entries (stage, start_at desc);

create or replace function public.set_role_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_role_entries_updated_at on public.role_entries;

create trigger trg_role_entries_updated_at
before update on public.role_entries
for each row
execute function public.set_role_entries_updated_at();

grant usage on schema public to anon, authenticated;
grant all on table public.role_entries to anon, authenticated;

alter table public.role_entries enable row level security;

drop policy if exists "role_entries_public_select" on public.role_entries;
create policy "role_entries_public_select"
on public.role_entries
for select
to anon, authenticated
using (true);

drop policy if exists "role_entries_public_insert" on public.role_entries;
create policy "role_entries_public_insert"
on public.role_entries
for insert
to anon, authenticated
with check (true);

drop policy if exists "role_entries_public_update" on public.role_entries;
create policy "role_entries_public_update"
on public.role_entries
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "role_entries_public_delete" on public.role_entries;
create policy "role_entries_public_delete"
on public.role_entries
for delete
to anon, authenticated
using (true);
