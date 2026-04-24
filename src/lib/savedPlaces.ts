// Meus Lugares (lista privada, por usuario)
// Armazenado em localStorage. Ideias que so voce ve ate decidir virar
// sugestao pro grupo via "usar como sugestao".

export type SavedPlace = {
  id: string
  owner: string
  name: string
  description: string
  kind: string // ex.: 'bar', 'restaurante', 'role', 'passeio'
  city: string
  neighborhood: string
  priceBand: '' | '$' | '$$' | '$$$' | '$$$$'
  photoUrl: string
  note: string
  linkedPlaceId: string
  createdAt: string
}

const STORAGE_KEY = 'roles:saved-places:v1'

const VALID_PRICE_BANDS = new Set<SavedPlace['priceBand']>([
  '',
  '$',
  '$$',
  '$$$',
  '$$$$',
])

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeSavedPlace(value: unknown): SavedPlace | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const id = textValue(record.id)
  const owner = textValue(record.owner)
  const name = textValue(record.name)

  if (!id || !owner || !name) return null

  const priceBand = textValue(record.priceBand) as SavedPlace['priceBand']

  return {
    id,
    owner,
    name,
    description: textValue(record.description),
    kind: textValue(record.kind),
    city: textValue(record.city),
    neighborhood: textValue(record.neighborhood),
    priceBand: VALID_PRICE_BANDS.has(priceBand) ? priceBand : '',
    photoUrl: textValue(record.photoUrl),
    note: textValue(record.note),
    linkedPlaceId: textValue(record.linkedPlaceId),
    createdAt: textValue(record.createdAt) || new Date(0).toISOString(),
  }
}

function readAll(): Array<SavedPlace> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeSavedPlace)
      .filter((place): place is SavedPlace => Boolean(place))
  } catch {
    return []
  }
}

function writeAll(list: Array<SavedPlace>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function uid() {
  return `sp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function listSavedPlaces(owner: string): Array<SavedPlace> {
  return readAll()
    .filter((place) => place.owner === owner)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getSavedPlace(id: string): SavedPlace | null {
  return readAll().find((place) => place.id === id) ?? null
}

export function createSavedPlace(
  input: Omit<SavedPlace, 'id' | 'createdAt' | 'linkedPlaceId'> & {
    linkedPlaceId?: string
  },
): SavedPlace {
  const all = readAll()
  const place: SavedPlace = {
    ...input,
    linkedPlaceId: input.linkedPlaceId ?? '',
    id: uid(),
    createdAt: new Date().toISOString(),
  }
  writeAll([place, ...all])
  return place
}

export function updateSavedPlace(
  id: string,
  patch: Partial<Omit<SavedPlace, 'id' | 'owner' | 'createdAt'>>,
): SavedPlace | null {
  const all = readAll()
  const index = all.findIndex((place) => place.id === id)
  if (index < 0) return null
  const next = { ...all[index], ...patch }
  all[index] = next
  writeAll(all)
  return next
}

export function deleteSavedPlace(id: string) {
  writeAll(readAll().filter((place) => place.id !== id))
}
