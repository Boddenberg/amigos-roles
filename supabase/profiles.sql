create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  group_slug text not null default 'main',
  full_name text not null default '',
  nickname text not null default '',
  avatar_url text not null default '',
  bio text not null default '',
  city text not null default '',
  neighborhood text not null default '',
  ai_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists group_slug text not null default 'main';

alter table public.profiles
  add column if not exists full_name text not null default '';

alter table public.profiles
  add column if not exists nickname text not null default '';

alter table public.profiles
  add column if not exists avatar_url text not null default '';

alter table public.profiles
  add column if not exists bio text not null default '';

alter table public.profiles
  add column if not exists city text not null default '';

alter table public.profiles
  add column if not exists neighborhood text not null default '';

alter table public.profiles
  add column if not exists ai_context jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.profiles
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date null,
  address_text text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profile_private
  add column if not exists birth_date date null;

alter table public.profile_private
  add column if not exists address_text text not null default '';

alter table public.profile_private
  add column if not exists notes text not null default '';

alter table public.profile_private
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.profile_private
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.role_entries
  add column if not exists group_slug text not null default 'main';

alter table public.role_entries
  add column if not exists profile_id uuid null references public.profiles (id) on delete set null;

update public.role_entries
set group_slug = 'main'
where coalesce(trim(group_slug), '') = '';

create index if not exists profiles_group_slug_idx
  on public.profiles (group_slug, full_name);

create index if not exists role_entries_group_slug_idx
  on public.role_entries (group_slug, start_at desc);

create or replace function public.set_common_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_common_updated_at();

drop trigger if exists trg_profile_private_updated_at on public.profile_private;
create trigger trg_profile_private_updated_at
before update on public.profile_private
for each row
execute function public.set_common_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    group_slug,
    full_name,
    nickname,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'group_slug', 'main'),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'membro'), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'nickname', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.profile_private (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

grant usage on schema public to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profile_private to authenticated;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

drop policy if exists "profiles_public_select" on public.profiles;
create policy "profiles_public_select"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_owner_delete" on public.profiles;
create policy "profiles_owner_delete"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "profile_private_owner_select" on public.profile_private;
create policy "profile_private_owner_select"
on public.profile_private
for select
to authenticated
using (auth.uid() = profile_id);

drop policy if exists "profile_private_owner_insert" on public.profile_private;
create policy "profile_private_owner_insert"
on public.profile_private
for insert
to authenticated
with check (auth.uid() = profile_id);

drop policy if exists "profile_private_owner_update" on public.profile_private;
create policy "profile_private_owner_update"
on public.profile_private
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "profile_private_owner_delete" on public.profile_private;
create policy "profile_private_owner_delete"
on public.profile_private
for delete
to authenticated
using (auth.uid() = profile_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_avatars_insert_own_folder" on storage.objects;
create policy "profile_avatars_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_avatars_update_own_folder" on storage.objects;
create policy "profile_avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_avatars_delete_own_folder" on storage.objects;
create policy "profile_avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
