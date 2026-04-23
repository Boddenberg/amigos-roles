import { supabase } from './supabase'

// ── Tipos do app (camelCase) ────────────────────────────────────────

export type Profile = {
  name: string
  displayName: string
  nickname: string
  photoUrl: string
  birthDate: string
  city: string
  neighborhood: string
  address: string
  updatedAt: string
}

export type Place = {
  id: string
  name: string
  city: string
  neighborhood: string
  address: string
  photoUrl: string
  addedBy: string
  createdAt: string
}

export type RoleStage = 'suggested' | 'confirmed' | 'done'

export type Role = {
  id: string
  title: string
  placeId: string | null
  date: string
  suggestedBy: string
  description: string
  stage: RoleStage
  confirmations: Array<string>
  createdAt: string
}

export type RoleWithPlace = Role & {
  place: Place | null
}

// ── Linhas do banco (snake_case) ────────────────────────────────────

type ProfileRow = {
  name: string
  display_name: string
  nickname: string
  photo_url: string
  birth_date: string | null
  city: string
  neighborhood: string
  address: string
  updated_at: string
}

type PlaceRow = {
  id: string
  name: string
  city: string
  neighborhood: string
  address: string
  photo_url: string
  added_by: string
  created_at: string
}

type RoleRow = {
  id: string
  title: string
  place_id: string | null
  date: string
  suggested_by: string
  description: string
  stage: RoleStage
  confirmations: Array<string>
  created_at: string
  updated_at: string
}

// ── Mappers ─────────────────────────────────────────────────────────

function toProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    displayName: row.display_name || row.name,
    nickname: row.nickname || row.display_name || row.name,
    photoUrl: row.photo_url || '',
    birthDate: row.birth_date ?? '',
    city: row.city || '',
    neighborhood: row.neighborhood || '',
    address: row.address || '',
    updatedAt: row.updated_at,
  }
}

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    city: row.city || '',
    neighborhood: row.neighborhood || '',
    address: row.address || '',
    photoUrl: row.photo_url || '',
    addedBy: row.added_by,
    createdAt: row.created_at,
  }
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    title: row.title,
    placeId: row.place_id,
    date: row.date,
    suggestedBy: row.suggested_by,
    description: row.description || '',
    stage: row.stage,
    confirmations: row.confirmations ?? [],
    createdAt: row.created_at,
  }
}

// ── PROFILES ────────────────────────────────────────────────────────

export async function listProfiles(): Promise<Array<Profile>> {
  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .order('display_name', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toProfile)
}

export async function getProfile(name: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (error) throw error
  return data ? toProfile(data) : null
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const row: ProfileRow = {
    name: profile.name,
    display_name: profile.displayName,
    nickname: profile.nickname,
    photo_url: profile.photoUrl,
    birth_date: profile.birthDate ? profile.birthDate : null,
    city: profile.city,
    neighborhood: profile.neighborhood,
    address: profile.address,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('app_profiles')
    .upsert(row, { onConflict: 'name' })
    .select()
    .single()
  if (error) throw error
  return toProfile(data)
}

// ── PLACES ──────────────────────────────────────────────────────────

export async function listPlaces(): Promise<Array<Place>> {
  const { data, error } = await supabase
    .from('app_places')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toPlace)
}

export async function createPlace(
  input: Omit<Place, 'id' | 'createdAt'>,
): Promise<Place> {
  const { data, error } = await supabase
    .from('app_places')
    .insert({
      name: input.name,
      city: input.city,
      neighborhood: input.neighborhood,
      address: input.address,
      photo_url: input.photoUrl,
      added_by: input.addedBy,
    })
    .select()
    .single()
  if (error) throw error
  return toPlace(data)
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('app_places').delete().eq('id', id)
  if (error) throw error
}

// ── ROLES ───────────────────────────────────────────────────────────

export async function listRoles(): Promise<Array<Role>> {
  const { data, error } = await supabase
    .from('app_roles')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toRole)
}

export async function listRolesWithPlaces(): Promise<Array<RoleWithPlace>> {
  const [roles, places] = await Promise.all([listRoles(), listPlaces()])
  const byId = new Map(places.map((p) => [p.id, p]))
  return roles.map((role) => ({
    ...role,
    place: role.placeId ? byId.get(role.placeId) ?? null : null,
  }))
}

export async function createRole(
  input: Omit<Role, 'id' | 'createdAt' | 'confirmations' | 'stage'> & {
    stage?: RoleStage
  },
): Promise<Role> {
  const { data, error } = await supabase
    .from('app_roles')
    .insert({
      title: input.title,
      place_id: input.placeId,
      date: input.date,
      suggested_by: input.suggestedBy,
      description: input.description,
      stage: input.stage ?? 'suggested',
      confirmations: [input.suggestedBy],
    })
    .select()
    .single()
  if (error) throw error
  return toRole(data)
}

export async function updateRole(
  id: string,
  patch: Partial<Pick<Role, 'title' | 'description' | 'date' | 'stage' | 'placeId' | 'confirmations'>>,
): Promise<Role | null> {
  const update: Record<string, unknown> = {}
  if (patch.title !== undefined) update.title = patch.title
  if (patch.description !== undefined) update.description = patch.description
  if (patch.date !== undefined) update.date = patch.date
  if (patch.stage !== undefined) update.stage = patch.stage
  if (patch.placeId !== undefined) update.place_id = patch.placeId
  if (patch.confirmations !== undefined) update.confirmations = patch.confirmations

  const { data, error } = await supabase
    .from('app_roles')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data ? toRole(data) : null
}

export async function toggleConfirmation(
  id: string,
  user: string,
): Promise<Role | null> {
  const { data: current, error: readError } = await supabase
    .from('app_roles')
    .select('confirmations')
    .eq('id', id)
    .maybeSingle()
  if (readError) throw readError
  if (!current) return null

  const has = (current.confirmations ?? []).includes(user)
  const next = has
    ? (current.confirmations as Array<string>).filter((u) => u !== user)
    : [...(current.confirmations as Array<string>), user]

  return updateRole(id, { confirmations: next })
}

export async function confirmRole(id: string): Promise<Role | null> {
  return updateRole(id, { stage: 'confirmed' })
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase.from('app_roles').delete().eq('id', id)
  if (error) throw error
}
