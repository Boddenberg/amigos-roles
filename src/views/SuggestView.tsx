import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import folhasIllustration from '../../folhas.png'
import { DatePicker } from '../components/DatePicker'
import { Icon } from '../components/Icon'
import { fileToCompressedDataUrl } from '../lib/photos'
import {
  createSavedPlace,
  listSavedPlaces,
  updateSavedPlace,
} from '../lib/savedPlaces'
import type { SavedPlace } from '../lib/savedPlaces'
import { createPlace, createRole } from '../lib/storage'
import type { Place } from '../lib/storage'

type SuggestMode = 'saved' | 'new'
type PriceBand = '' | '$' | '$$' | '$$$' | '$$$$'

type PrefillSource = {
  kind: 'saved-place'
  label: string
}

export type SuggestPrefill = {
  mode?: SuggestMode
  savedPlaceId?: string
  source?: PrefillSource
}

type SuggestViewProps = {
  currentUser: string
  places: Array<Place>
  prefill?: SuggestPrefill | null
  onCreated: () => void | Promise<void>
  onToast: (message: string, variant?: 'info' | 'error') => void
  onCancel: () => void
  onOpenPlaces?: () => void
}

const TYPE_OPTIONS = [
  'Gastronômico',
  'Bar',
  'Café',
  'Ao ar livre',
  'Cultural',
  'Noite',
  'Casa da galera',
]

const PRICE_OPTIONS: Array<{ value: PriceBand; label: string }> = [
  { value: '', label: 'Sem faixa' },
  { value: '$', label: 'R$ econômico' },
  { value: '$$', label: 'R$$ médio' },
  { value: '$$$', label: 'R$$$ alto' },
  { value: '$$$$', label: 'R$$$$ premium' },
]

const DESCRIPTION_LIMIT = 120

function todayInputValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

function nextSaturdayInputValue() {
  const date = new Date()
  const daysUntil = (6 - date.getDay() + 7) % 7 || 7
  date.setDate(date.getDate() + daysUntil)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

function formatPreviewDate(iso: string) {
  if (!iso) return 'Escolher data'
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function locationLabel(place?: {
  city: string
  neighborhood: string
}) {
  return [place?.neighborhood, place?.city].filter(Boolean).join(' · ')
}

function shortLocationLabel(place?: {
  city: string
  neighborhood: string
}) {
  return place?.neighborhood || place?.city || 'Local a definir'
}

function buildRoleDescription(input: {
  kind: string
  priceBand: PriceBand
  description: string
}) {
  return [
    input.kind.trim() ? `@kind:${input.kind.trim()}` : '',
    input.priceBand ? `@price:${input.priceBand}` : '',
    input.description.trim(),
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}

function coverLetters(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase()
}

function findMatchingPlace(savedPlace: SavedPlace, places: Array<Place>) {
  if (savedPlace.linkedPlaceId) {
    const linked = places.find((place) => place.id === savedPlace.linkedPlaceId)
    if (linked) return linked
  }

  const savedName = normalizeLookup(savedPlace.name)
  const savedCity = normalizeLookup(savedPlace.city)
  const savedNeighborhood = normalizeLookup(savedPlace.neighborhood)

  if (!savedName) return null

  return (
    places.find((place) => {
      if (normalizeLookup(place.name) !== savedName) return false

      if (savedCity && normalizeLookup(place.city) !== savedCity) return false

      if (
        savedNeighborhood &&
        normalizeLookup(place.neighborhood) !== savedNeighborhood
      ) {
        return false
      }

      return true
    }) ?? null
  )
}

export function SuggestView({
  currentUser,
  places,
  prefill,
  onCreated,
  onToast,
  onCancel,
  onOpenPlaces,
}: SuggestViewProps) {
  const [mode, setMode] = useState<SuggestMode>(prefill?.mode ?? 'saved')
  const [savedPlaces, setSavedPlaces] = useState<Array<SavedPlace>>(() =>
    listSavedPlaces(currentUser),
  )
  const [selectedSavedPlaceId, setSelectedSavedPlaceId] = useState<string | null>(
    () => prefill?.savedPlaceId ?? listSavedPlaces(currentUser)[0]?.id ?? null,
  )
  const [date, setDate] = useState(nextSaturdayInputValue())

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState('')
  const [priceBand, setPriceBand] = useState<PriceBand>('')
  const [placeName, setPlaceName] = useState('')
  const [placeCity, setPlaceCity] = useState('São Paulo')
  const [placeNeighborhood, setPlaceNeighborhood] = useState('')
  const [placeAddress, setPlaceAddress] = useState('')
  const [placePhotoUrl, setPlacePhotoUrl] = useState('')
  const [saveToMyPlaces, setSaveToMyPlaces] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedSavedPlace =
    savedPlaces.find((place) => place.id === selectedSavedPlaceId) ?? null
  const activeSavedPlace = selectedSavedPlace ?? savedPlaces[0] ?? null
  const activeSavedPlaceId = activeSavedPlace?.id ?? null
  const descriptionCount = description.length

  function resetSavedFlow() {
    setDate(nextSaturdayInputValue())
  }

  function resetNewFlow() {
    setTitle('')
    setDescription('')
    setKind('')
    setPriceBand('')
    setPlaceName('')
    setPlaceCity('São Paulo')
    setPlaceNeighborhood('')
    setPlaceAddress('')
    setPlacePhotoUrl('')
    setSaveToMyPlaces(true)
    setDate(nextSaturdayInputValue())
  }

  function syncSavedPlace(nextSavedPlace: SavedPlace) {
    setSavedPlaces((current) =>
      current.map((place) =>
        place.id === nextSavedPlace.id ? nextSavedPlace : place,
      ),
    )
  }

  async function ensureSavedPlaceIsReusable(savedPlace: SavedPlace) {
    const existingPlace = findMatchingPlace(savedPlace, places)
    if (existingPlace) {
      if (savedPlace.linkedPlaceId !== existingPlace.id) {
        const updated = updateSavedPlace(savedPlace.id, {
          linkedPlaceId: existingPlace.id,
        })
        if (updated) syncSavedPlace(updated)
      }
      return existingPlace.id
    }

    const createdPlace = await createPlace({
      name: savedPlace.name,
      city: savedPlace.city,
      neighborhood: savedPlace.neighborhood,
      address: '',
      photoUrl: savedPlace.photoUrl,
      addedBy: currentUser,
    })

    const updated = updateSavedPlace(savedPlace.id, {
      linkedPlaceId: createdPlace.id,
    })
    if (updated) syncSavedPlace(updated)

    return createdPlace.id
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPlacePhotoUrl(dataUrl)
    } catch {
      onToast('Não consegui carregar essa foto.', 'error')
    }
  }

  async function handleSavedSubmit(event: FormEvent) {
    event.preventDefault()

    if (!activeSavedPlace) {
      onToast('Escolha um lugar salvo para sugerir.', 'error')
      return
    }

    setSaving(true)
    try {
      const placeId = await ensureSavedPlaceIsReusable(activeSavedPlace)

      await createRole({
        title: activeSavedPlace.name.trim(),
        placeId,
        date,
        suggestedBy: currentUser,
        description: buildRoleDescription({
          kind: activeSavedPlace.kind,
          priceBand: activeSavedPlace.priceBand,
          description: activeSavedPlace.description,
        }),
      })

      resetSavedFlow()
      await onCreated()
      onToast('Sugestão publicada para o grupo!')
    } catch (error) {
      console.error(error)
      onToast('Não consegui publicar essa sugestão.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleNewSubmit(event: FormEvent) {
    event.preventDefault()

    if (!title.trim()) {
      onToast('Dê um nome para o rolê.', 'error')
      return
    }

    if (!placeName.trim()) {
      onToast('Dê um nome para o local.', 'error')
      return
    }

    setSaving(true)
    try {
      const createdPlace = await createPlace({
        name: placeName.trim(),
        city: placeCity.trim(),
        neighborhood: placeNeighborhood.trim(),
        address: placeAddress.trim(),
        photoUrl: placePhotoUrl,
        addedBy: currentUser,
      })

      await createRole({
        title: title.trim(),
        placeId: createdPlace.id,
        date,
        suggestedBy: currentUser,
        description: buildRoleDescription({
          kind,
          priceBand,
          description,
        }),
      })

      if (saveToMyPlaces) {
        const savedPlace = createSavedPlace({
          owner: currentUser,
          name: placeName.trim(),
          description: description.trim() || title.trim(),
          kind: kind.trim(),
          city: placeCity.trim(),
          neighborhood: placeNeighborhood.trim(),
          priceBand,
          photoUrl: placePhotoUrl,
          note: '',
          linkedPlaceId: createdPlace.id,
        })

        setSavedPlaces((current) => [savedPlace, ...current])
        setSelectedSavedPlaceId(savedPlace.id)
      }

      resetNewFlow()
      await onCreated()
      onToast(
        saveToMyPlaces
          ? 'Sugestão salva e local guardado em Meus lugares.'
          : 'Sugestão salva para o grupo!',
      )
    } catch (error) {
      console.error(error)
      onToast('Não consegui salvar essa sugestão.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function focusPlaceField() {
    const input = document.getElementById('place-name') as HTMLInputElement | null
    input?.focus()
  }

  function handleHowItWorks() {
    onToast(
      mode === 'saved'
        ? 'Escolha um lugar salvo, ajuste a data e publique para o grupo.'
        : 'Preencha os dados do rolê, escolha o local e salve em Meus lugares se quiser reaproveitar depois.',
    )
  }

  const topText =
    mode === 'saved'
      ? 'Publique um lugar salvo ou crie um rolê novo sem complicação.'
      : 'Crie um rolê novo sem complicação.'

  const newRoleTitle = title.trim() || 'Sua nova sugestão'
  const newRoleLocation = placeName.trim() || 'Escolha um local'

  return (
    <div className="suggest-page">
      <header className="suggest-page__header">
        <div className="suggest-page__copy">
          <span className="home-block__eyebrow">Para o grupo</span>
          <h2 className="suggest-page__title">Sugestões</h2>
          <p className="suggest-page__text">{topText}</p>
        </div>

        <button
          type="button"
          className="suggest-page__help"
          onClick={handleHowItWorks}
        >
          <Icon name="info" size={18} />
          Como funciona
        </button>
      </header>

      <section
        className="suggest-mode-switch"
        role="tablist"
        aria-label="Tipo de sugestão"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'saved'}
          className={`suggest-mode-switch__item${
            mode === 'saved' ? ' suggest-mode-switch__item--active' : ''
          }`}
          onClick={() => setMode('saved')}
        >
          <Icon name="bookmark" size={20} />
          Lugar salvo
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'new'}
          className={`suggest-mode-switch__item${
            mode === 'new' ? ' suggest-mode-switch__item--active' : ''
          }`}
          onClick={() => setMode('new')}
        >
          <Icon name="plus" size={20} />
          Novo rolê
        </button>
      </section>

      {mode === 'saved' ? (
        <form className="suggest-layout suggest-layout--saved" onSubmit={handleSavedSubmit}>
          <section className="suggest-showcase suggest-showcase--saved">
            <div className="suggest-showcase__media">
              {activeSavedPlace?.photoUrl ? (
                <img src={activeSavedPlace.photoUrl} alt={activeSavedPlace.name} />
              ) : (
                <div className="suggest-showcase__placeholder">
                  {activeSavedPlace ? coverLetters(activeSavedPlace.name) : 'LS'}
                </div>
              )}
              <span className="suggest-showcase__badge">Lugar salvo</span>
            </div>

            <div className="suggest-showcase__body">
              <h3 className="suggest-showcase__title">
                {activeSavedPlace?.name || 'Escolha um lugar salvo'}
              </h3>

              <div className="suggest-showcase__meta suggest-showcase__meta--saved">
                <span>
                  <Icon name="pin" size={18} />
                  {activeSavedPlace
                    ? shortLocationLabel(activeSavedPlace)
                    : 'Escolha um lugar'}
                </span>
                <span className="suggest-showcase__separator" aria-hidden="true" />
                <DatePicker
                  value={date}
                  onChange={setDate}
                  minDate={todayInputValue()}
                  variant="inline"
                  placeholder="Escolher data"
                />
                <span className="suggest-showcase__separator" aria-hidden="true" />
                <span>
                  <Icon name="user" size={18} />
                  {currentUser} sugeriu
                </span>
              </div>

              <div className="suggest-showcase__divider" />
              <p className="suggest-showcase__sub">
                {activeSavedPlace
                  ? 'Escolha a data e publique para o grupo.'
                  : 'Selecione um lugar salvo para continuar.'}
              </p>
            </div>
          </section>

          <section className="form-card suggest-saved-library">
            <div className="suggest-saved-library__header">
              <div className="suggest-saved-library__copy">
                <h3 className="form-card__title">Meus lugares salvos</h3>
              </div>

              {onOpenPlaces ? (
                <button
                  type="button"
                  className="suggest-saved-library__link"
                  onClick={onOpenPlaces}
                >
                  Ver todos
                  <Icon name="chevron-right" size={18} />
                </button>
              ) : null}
            </div>

            {savedPlaces.length === 0 ? (
              <div className="home-empty suggest-empty-saved">
                <div className="home-empty__icon" aria-hidden="true">
                  <Icon name="bookmark" size={22} />
                </div>
                <div className="home-empty__title">Você ainda não salvou lugares.</div>
                <div className="home-empty__text">
                  Crie um novo rolê agora e marque a opção para guardar esse local
                  na sua lista privada.
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => setMode('new')}
                >
                  <Icon name="plus" size={16} />
                  Criar novo rolê
                </button>
              </div>
            ) : (
              <div className="suggest-saved-library__list" aria-label="Lugares salvos">
                {savedPlaces.slice(0, 3).map((place) => {
                  const isActive = place.id === activeSavedPlaceId

                  return (
                    <article
                      key={place.id}
                      className={`suggest-saved-row${
                        isActive ? ' suggest-saved-row--active' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="suggest-saved-row__main"
                        onClick={() => setSelectedSavedPlaceId(place.id)}
                      >
                        <span className="suggest-saved-row__thumb" aria-hidden="true">
                          {place.photoUrl ? (
                            <img src={place.photoUrl} alt="" />
                          ) : (
                            <span className="suggest-saved-row__fallback">
                              {coverLetters(place.name)}
                            </span>
                          )}
                        </span>

                        <span className="suggest-saved-row__copy">
                          <strong>{place.name}</strong>
                          <span>{locationLabel(place) || 'Local a definir'}</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`suggest-saved-row__action${
                          isActive ? ' suggest-saved-row__action--active' : ''
                        }`}
                        onClick={() => setSelectedSavedPlaceId(place.id)}
                      >
                        {isActive ? 'Usando' : 'Usar'}
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <div className="suggest-actions suggest-actions--page">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving || !activeSavedPlace}
            >
              <Icon name="sparkle" size={16} />
              {saving ? 'Publicando...' : 'Publicar sugestão'}
            </button>
          </div>
        </form>
      ) : null}

      {mode === 'new' ? (
        <form className="suggest-layout suggest-layout--new" onSubmit={handleNewSubmit}>
          <section className="suggest-showcase suggest-showcase--new">
            <label className="suggest-showcase__media suggest-showcase__media--upload">
              {placePhotoUrl ? (
                <img src={placePhotoUrl} alt="Prévia do local" />
              ) : (
                <img
                  src={folhasIllustration}
                  alt=""
                  className="suggest-showcase__illustration"
                />
              )}

              <span className="suggest-showcase__badge">Novo rolê</span>

              <span className="suggest-upload-card">
                <span className="suggest-upload-card__icon">
                  <Icon name="image" size={30} />
                </span>
                <strong>
                  {placePhotoUrl ? 'Trocar foto do local' : 'Adicionar foto do local'}
                </strong>
                <span>
                  {placePhotoUrl
                    ? 'Toque para trocar a foto.'
                    : 'Toque para escolher uma foto.'}
                </span>
              </span>

              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>

            <div className="suggest-showcase__body">
              <h3 className="suggest-showcase__title">{newRoleTitle}</h3>

              <div className="suggest-showcase__meta">
                <span>
                  <Icon name="pin" size={18} />
                  {newRoleLocation}
                </span>
                <span className="suggest-showcase__separator" aria-hidden="true" />
                <span>
                  <Icon name="calendar" size={18} />
                  {formatPreviewDate(date)}
                </span>
                <span className="suggest-showcase__separator" aria-hidden="true" />
                <span>
                  <Icon name="user" size={18} />
                  {currentUser}
                </span>
              </div>
            </div>
          </section>

          <section className="form-card suggest-section">
            <div className="suggest-section__header">
              <span className="suggest-section__icon suggest-section__icon--peach">
                <Icon name="edit" size={18} />
              </span>
              <div className="suggest-section__copy">
                <h3 className="form-card__title">Essencial</h3>
              </div>
            </div>

            <div className="suggest-section__grid suggest-section__grid--essential">
              <div className="form-group">
                <label htmlFor="role-title">Nome do rolê</label>
                <input
                  id="role-title"
                  className="input"
                  type="text"
                  placeholder="Jantar japonês + karaokê"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role-desc">Descrição curta</label>
                <textarea
                  id="role-desc"
                  className="textarea"
                  placeholder="Jantar seguido de karaokê para fechar a noite."
                  value={description}
                  maxLength={DESCRIPTION_LIMIT}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <span className="suggest-field-counter">
                  {descriptionCount}/{DESCRIPTION_LIMIT}
                </span>
              </div>
            </div>
          </section>

          <section className="form-card suggest-section">
            <div className="suggest-section__header">
              <span className="suggest-section__icon suggest-section__icon--mint">
                <Icon name="tag" size={18} />
              </span>
              <div className="suggest-section__copy">
                <h3 className="form-card__title">Detalhes rápidos</h3>
              </div>
            </div>

            <div className="suggest-chip-group">
              <label>Faixa de preço</label>
              <div className="chip-select chip-select--wide">
                {PRICE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value || 'none'}
                    className={`chip-select__option${
                      priceBand === option.value
                        ? ' chip-select__option--active'
                        : ''
                    }`}
                    onClick={() => setPriceBand(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="suggest-chip-group">
              <label>Tipo do rolê</label>
              <div className="chip-select chip-select--wide">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`chip-select__option${
                      kind === option ? ' chip-select__option--active' : ''
                    }`}
                    onClick={() => setKind(kind === option ? '' : option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-card suggest-section">
            <div className="suggest-section__header">
              <span className="suggest-section__icon suggest-section__icon--sky">
                <Icon name="pin" size={18} />
              </span>
              <div className="suggest-section__copy">
                <h3 className="form-card__title">Quando e onde</h3>
              </div>
            </div>

            <div className="suggest-where-grid">
              <button
                type="button"
                className="suggest-inline-field"
                onClick={focusPlaceField}
              >
                <span className="suggest-inline-field__label">Local</span>
                <span className="suggest-inline-field__value">
                  <Icon name="pin" size={18} />
                  {placeName.trim() || 'Escolher local'}
                </span>
                <Icon name="chevron-right" size={18} />
              </button>

              <div className="suggest-inline-field suggest-inline-field--date">
                <span className="suggest-inline-field__label">Data</span>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  minDate={todayInputValue()}
                  variant="inline"
                  placeholder="Escolher data"
                />
              </div>
            </div>

            <div className="suggest-section__grid suggest-section__grid--place">
              <div className="form-group">
                <label htmlFor="place-name">Nome do local</label>
                <input
                  id="place-name"
                  className="input"
                  type="text"
                  placeholder="Jantar com varanda"
                  value={placeName}
                  onChange={(event) => setPlaceName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-neighborhood">Bairro</label>
                <input
                  id="place-neighborhood"
                  className="input"
                  type="text"
                  placeholder="Liberdade"
                  value={placeNeighborhood}
                  onChange={(event) => setPlaceNeighborhood(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-city">Cidade</label>
                <input
                  id="place-city"
                  className="input"
                  type="text"
                  value={placeCity}
                  onChange={(event) => setPlaceCity(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-address">Endereço</label>
                <input
                  id="place-address"
                  className="input"
                  type="text"
                  placeholder="Rua, número..."
                  value={placeAddress}
                  onChange={(event) => setPlaceAddress(event.target.value)}
                />
              </div>
            </div>
          </section>

          <label className="suggest-save-card">
            <span className="suggest-save-card__copy">
              <strong>Salvar também em Meus lugares</strong>
              <span>Guarda esse local na sua lista privada.</span>
            </span>

            <span
              className={`suggest-save-card__switch${
                saveToMyPlaces ? ' suggest-save-card__switch--active' : ''
              }`}
              aria-hidden="true"
            >
              <span />
            </span>

            <input
              type="checkbox"
              checked={saveToMyPlaces}
              onChange={(event) => setSaveToMyPlaces(event.target.checked)}
            />
          </label>

          <div className="suggest-actions suggest-actions--page">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              <Icon name="sparkle" size={16} />
              {saving ? 'Salvando...' : 'Salvar sugestão'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
