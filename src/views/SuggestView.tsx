import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { DatePicker } from '../components/DatePicker'
import { Icon } from '../components/Icon'
import { fileToCompressedDataUrl } from '../lib/photos'
import { createPlace, createRole } from '../lib/storage'
import type { Place } from '../lib/storage'

type PriceBand = '' | '$' | '$$' | '$$$' | '$$$$'

type PrefillSource = {
  kind: 'saved-place'
  label: string
  type?: string
  priceBand?: PriceBand
  personalNote?: string
}

export type SuggestPrefill = {
  title?: string
  description?: string
  placeDraft?: {
    name: string
    city: string
    neighborhood: string
    photoUrl: string
  }
  source?: PrefillSource
}

type SuggestViewProps = {
  currentUser: string
  places: Array<Place>
  prefill?: SuggestPrefill | null
  onConsumedPrefill?: () => void
  onCreated: () => void | Promise<void>
  onToast: (message: string, variant?: 'info' | 'error') => void
  onCancel: () => void
}

const TYPE_OPTIONS = [
  'Gastronomico',
  'Bar',
  'Cafe',
  'Ao ar livre',
  'Cultural',
  'Noite',
  'Casa da galera',
]

const PRICE_OPTIONS: Array<{ value: PriceBand; label: string }> = [
  { value: '', label: 'Sem faixa' },
  { value: '$', label: '$ economico' },
  { value: '$$', label: '$$ medio' },
  { value: '$$$', label: '$$$ especial' },
  { value: '$$$$', label: '$$$$ premium' },
]

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
  if (!iso) return 'Escolha um dia'
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
  return [place?.neighborhood, place?.city].filter(Boolean).join(' - ')
}

function priceBandLabel(priceBand: PriceBand) {
  return PRICE_OPTIONS.find((option) => option.value === priceBand)?.label ?? 'Sem faixa'
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

export function SuggestView({
  currentUser,
  places,
  prefill,
  onConsumedPrefill,
  onCreated,
  onToast,
  onCancel,
}: SuggestViewProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(nextSaturdayInputValue())
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState('')
  const [priceBand, setPriceBand] = useState<PriceBand>('')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeDraft, setPlaceDraft] = useState<{
    name: string
    city: string
    neighborhood: string
    photoUrl: string
  } | null>(null)
  const [showPlaceSheet, setShowPlaceSheet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prefillSource, setPrefillSource] = useState<PrefillSource | null>(null)

  useEffect(() => {
    if (!prefill) return

    const timer = window.setTimeout(() => {
      if (prefill.title) setTitle(prefill.title)
      if (prefill.description) setDescription(prefill.description)
      if (prefill.source) {
        setPrefillSource(prefill.source)
        setKind(prefill.source.type ?? '')
        setPriceBand(prefill.source.priceBand ?? '')
      }
      if (prefill.placeDraft) {
        setPlaceDraft(prefill.placeDraft)
        setPlaceId(null)
      }
      onConsumedPrefill?.()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [prefill, onConsumedPrefill])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return onToast('Da um nome pro role.', 'error')

    setSaving(true)
    try {
      let finalPlaceId = placeId

      if (!finalPlaceId && placeDraft) {
        const created = await createPlace({
          name: placeDraft.name,
          city: placeDraft.city,
          neighborhood: placeDraft.neighborhood,
          address: '',
          photoUrl: placeDraft.photoUrl,
          addedBy: currentUser,
        })
        finalPlaceId = created.id
      }

      if (!finalPlaceId) {
        onToast('Escolhe um lugar ou cria um novo.', 'error')
        return
      }

      await createRole({
        title: title.trim(),
        placeId: finalPlaceId,
        date,
        suggestedBy: currentUser,
        description: buildRoleDescription({
          kind,
          priceBand,
          description,
        }),
      })

      setPlaceId(null)
      setPlaceDraft(null)
      setTitle('')
      setDescription('')
      setKind('')
      setPriceBand('')
      setPrefillSource(null)
      setDate(nextSaturdayInputValue())
      await onCreated()
      onToast('Sugestao no ar!')
    } catch (error) {
      console.error(error)
      onToast('Nao consegui salvar a sugestao.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePlaceCreated(place: Place) {
    setPlaceId(place.id)
    setPlaceDraft(null)
    setShowPlaceSheet(false)
    await onCreated()
    onToast('Lugar cadastrado.')
  }

  const selectedPlace =
    (placeId && places.find((place) => place.id === placeId)) || null
  const previewPlace = selectedPlace ?? placeDraft
  const previewTitle = title.trim() || 'Sua nova sugestao'
  const previewDescription =
    description.trim() ||
    'Preencha so o essencial e deixe o role com cara de convite bem pensado.'
  const isFromSavedPlace = prefillSource?.kind === 'saved-place'

  return (
    <div className="suggest-mobile">
      <header className="suggest-header">
        <div className="suggest-header__copy">
          <span className="home-block__eyebrow">Sugestao para o grupo</span>
          <h2 className="suggest-header__title">Nova sugestao</h2>
          <p className="suggest-header__text">
            Monte um role bonito, claro e facil de entender no celular antes de
            mandar para a turma.
          </p>
        </div>
      </header>

      {isFromSavedPlace ? (
        <section className="suggest-prefill-card">
          <div className="suggest-prefill-card__header">
            <span className="suggest-prefill-card__icon" aria-hidden="true">
              <Icon name="bookmark" size={16} />
            </span>
            <div>
              <div className="home-block__eyebrow">Veio de Meus lugares</div>
              <h3 className="suggest-prefill-card__title">{prefillSource?.label}</h3>
            </div>
          </div>

          <p className="suggest-prefill-card__text">
            Essa ideia estava guardada como rascunho privado. Agora voce so
            ajusta o necessario para transformar em sugestao publica.
          </p>

          <div className="suggest-prefill-card__tags">
            {kind ? <span className="chip chip--sm chip--primary">{kind}</span> : null}
            {priceBand ? (
              <span className="chip chip--sm">{priceBandLabel(priceBand)}</span>
            ) : null}
            <span className="chip chip--sm chip--accent">Rascunho privado</span>
          </div>

          {prefillSource?.personalNote ? (
            <div className="suggest-prefill-card__note">
              <span>Observacao pessoal</span>
              <p>{prefillSource.personalNote}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="suggest-stage">
        <div className="suggest-stage__media">
          {previewPlace?.photoUrl ? (
            <img src={previewPlace.photoUrl} alt={previewPlace.name} />
          ) : (
            <div className="suggest-stage__placeholder">
              <Icon name="image" size={24} />
              <span>Adicione uma foto opcional pelo local</span>
            </div>
          )}
        </div>

        <div className="suggest-stage__body">
          <div className="suggest-stage__chips">
            <span className="chip chip--sm chip--primary">
              {kind || 'Tipo do role'}
            </span>
            <span className="chip chip--sm">{priceBandLabel(priceBand)}</span>
            <span className="chip chip--sm chip--accent">{formatPreviewDate(date)}</span>
          </div>

          <h3 className="suggest-stage__title">{previewTitle}</h3>
          <p className="suggest-stage__text">{previewDescription}</p>

          <div className="suggest-stage__meta">
            <span>
              <Icon name="pin" size={13} />
              {previewPlace ? locationLabel(previewPlace) || previewPlace.name : 'Escolha um local'}
            </span>
            <span>
              <Icon name="user" size={13} />
              {currentUser}
            </span>
          </div>
        </div>
      </section>

      <form className="form suggest-mobile__form" onSubmit={handleSubmit}>
        <section className="form-card suggest-panel">
          <div className="form-card__header">
            <div>
              <h3 className="form-card__title">Detalhes da sugestao</h3>
              <p className="form-card__sub">
                Deixe o convite bonito e facil de escanear.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role-title">Nome do role</label>
            <input
              id="role-title"
              className="input"
              type="text"
              placeholder="Ex.: Jantar japones + karaoke"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role-desc">Descricao curta</label>
            <textarea
              id="role-desc"
              className="textarea"
              placeholder="Conta o plano rapidinho e o que faz essa ideia valer a pena."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Tipo do role</label>
            <div className="chip-select">
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

        <section className="form-card suggest-panel">
          <div className="form-card__header">
            <div>
              <h3 className="form-card__title">Local, data e contexto</h3>
              <p className="form-card__sub">
                Tudo em coluna unica, com menos cara de formulario tradicional.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Local</label>
            {selectedPlace ? (
              <button
                type="button"
                className="selected-place"
                onClick={() => setShowPlaceSheet(true)}
              >
                <span className="selected-place__thumb" aria-hidden="true">
                  {selectedPlace.photoUrl ? (
                    <img src={selectedPlace.photoUrl} alt="" />
                  ) : (
                    <Icon name="image" size={20} />
                  )}
                </span>
                <span className="selected-place__body">
                  <strong>{selectedPlace.name}</strong>
                  <span>{locationLabel(selectedPlace) || 'Sem localizacao detalhada'}</span>
                </span>
                <span className="selected-place__change">Trocar</span>
              </button>
            ) : placeDraft ? (
              <button
                type="button"
                className="selected-place"
                onClick={() => setShowPlaceSheet(true)}
              >
                <span className="selected-place__thumb" aria-hidden="true">
                  {placeDraft.photoUrl ? (
                    <img src={placeDraft.photoUrl} alt="" />
                  ) : (
                    <Icon name="image" size={20} />
                  )}
                </span>
                <span className="selected-place__body">
                  <strong>{placeDraft.name}</strong>
                  <span>{locationLabel(placeDraft) || 'Novo local'}</span>
                </span>
                <span className="selected-place__change">Trocar</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => setShowPlaceSheet(true)}
              >
                Escolher local
              </button>
            )}
          </div>

          <div className="form-group">
            <label>Foto opcional</label>
            <button
              type="button"
              className="suggest-photo-field"
              onClick={() => setShowPlaceSheet(true)}
            >
              <span className="suggest-photo-field__thumb" aria-hidden="true">
                {previewPlace?.photoUrl ? (
                  <img src={previewPlace.photoUrl} alt="" />
                ) : (
                  <Icon name="image" size={18} />
                )}
              </span>
              <span className="suggest-photo-field__body">
                <strong>
                  {previewPlace?.photoUrl
                    ? 'Usando a foto do local escolhido'
                    : 'Adicionar foto via local'}
                </strong>
                <span>
                  {previewPlace
                    ? 'Se quiser outra imagem, troque o local ou cadastre um novo com foto.'
                    : 'Ao escolher ou criar um local, voce pode deixar a sugestao com imagem.'}
                </span>
              </span>
            </button>
          </div>

          <div className="form-group">
            <label>Data</label>
            <DatePicker
              value={date}
              onChange={setDate}
              minDate={todayInputValue()}
            />
          </div>

          <div className="form-group">
            <label>Faixa de preco</label>
            <div className="chip-select">
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

          <div className="form-group">
            <label>Quem esta sugerindo</label>
            <div className="suggest-owner">
              <Avatar name={currentUser} size="sm" />
              <div className="suggest-owner__copy">
                <strong>{currentUser}</strong>
                <span>Seu nome vai aparecer como quem sugeriu esse role.</span>
              </div>
            </div>
          </div>
        </section>

        <div className="suggest-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar sugestao'}
          </button>
        </div>
      </form>

      {showPlaceSheet ? (
        <PlacePickerSheet
          places={places}
          currentUser={currentUser}
          onClose={() => setShowPlaceSheet(false)}
          onSelect={(id) => {
            setPlaceId(id)
            setPlaceDraft(null)
            setShowPlaceSheet(false)
          }}
          onCreated={handlePlaceCreated}
          onToast={onToast}
        />
      ) : null}
    </div>
  )
}

type PlacePickerSheetProps = {
  places: Array<Place>
  currentUser: string
  onClose: () => void
  onSelect: (id: string) => void
  onCreated: (place: Place) => void | Promise<void>
  onToast: (message: string, variant?: 'info' | 'error') => void
}

function PlacePickerSheet({
  places,
  currentUser,
  onClose,
  onSelect,
  onCreated,
  onToast,
}: PlacePickerSheetProps) {
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [name, setName] = useState('')
  const [city, setCity] = useState('Sao Paulo')
  const [neighborhood, setNeighborhood] = useState('')
  const [address, setAddress] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPhotoUrl(dataUrl)
    } catch {
      onToast('Nao consegui carregar essa foto.', 'error')
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return onToast('Da um nome pro lugar.', 'error')

    setSaving(true)
    try {
      const place = await createPlace({
        name: name.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        photoUrl,
        addedBy: currentUser,
      })
      await onCreated(place)
    } catch (error) {
      console.error(error)
      onToast('Nao consegui salvar o lugar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__handle" aria-hidden="true" />

        <div className="sheet__header">
          <div>
            <h2 className="sheet__title">Escolher local</h2>
            <p className="sheet__sub">
              Reaproveite um local salvo ou crie um novo sem sair da sugestao.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="sheet-switcher" role="tablist" aria-label="Modo da folha">
          <button
            type="button"
            className={`sheet-switcher__item${
              mode === 'list' ? ' sheet-switcher__item--active' : ''
            }`}
            onClick={() => setMode('list')}
          >
            Escolher
          </button>
          <button
            type="button"
            className={`sheet-switcher__item${
              mode === 'create' ? ' sheet-switcher__item--active' : ''
            }`}
            onClick={() => setMode('create')}
          >
            Novo local
          </button>
        </div>

        {mode === 'list' ? (
          <div className="place-grid">
            <button
              type="button"
              className="place-card place-card--new"
              onClick={() => setMode('create')}
            >
              <span className="place-card__thumb place-card__thumb--new" aria-hidden="true">
                <Icon name="plus" size={18} />
              </span>
              <span className="place-card__body">
                <strong>Cadastrar novo local</strong>
                <span>Adicione foto, bairro e endereco quando precisar.</span>
              </span>
              <span className="place-card__action">Criar</span>
            </button>

            {places.map((place) => (
              <button
                type="button"
                key={place.id}
                className="place-card"
                onClick={() => onSelect(place.id)}
              >
                <span className="place-card__thumb" aria-hidden="true">
                  {place.photoUrl ? (
                    <img src={place.photoUrl} alt="" />
                  ) : (
                    <Icon name="image" size={20} />
                  )}
                </span>
                <span className="place-card__body">
                  <strong>{place.name}</strong>
                  <span>
                    {locationLabel(place) || 'Sem localizacao detalhada'}
                  </span>
                </span>
                <span className="place-card__action">Usar</span>
              </button>
            ))}
          </div>
        ) : (
          <form className="form" onSubmit={handleCreate}>
            <section className="form-card form-card--flat">
              <div className="form-group">
                <label>Foto opcional</label>
                <label className="photo-picker">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" />
                  ) : (
                    <span className="photo-picker__empty">
                      <Icon name="image" size={20} />
                      Toque para escolher uma foto
                    </span>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="place-name">Nome do local</label>
                <input
                  id="place-name"
                  className="input"
                  type="text"
                  placeholder="Ex.: Casa do Bruno"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-city">Cidade</label>
                <input
                  id="place-city"
                  className="input"
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-neighborhood">Bairro</label>
                <input
                  id="place-neighborhood"
                  className="input"
                  type="text"
                  placeholder="Ex.: Liberdade"
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place-address">Endereco</label>
                <input
                  id="place-address"
                  className="input"
                  type="text"
                  placeholder="Rua, numero..."
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
            </section>

            <div className="sheet__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setMode('list')}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar local'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
