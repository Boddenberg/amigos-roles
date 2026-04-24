import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { fileToCompressedDataUrl } from '../lib/photos'
import {
  createSavedPlace,
  deleteSavedPlace,
  listSavedPlaces,
  updateSavedPlace,
} from '../lib/savedPlaces'
import type { SavedPlace } from '../lib/savedPlaces'

type Props = {
  currentUser: string
  onToast: (message: string, variant?: 'info' | 'error') => void
  onUseAsSuggestion: (place: SavedPlace) => void
}

const KIND_OPTIONS = [
  'Restaurante',
  'Bar',
  'Cafe',
  'Ao ar livre',
  'Cultural',
  'Noite',
  'Casa da galera',
]

const PRICE_OPTIONS: Array<{ value: SavedPlace['priceBand']; label: string }> = [
  { value: '', label: 'Sem faixa' },
  { value: '$', label: '$ economico' },
  { value: '$$', label: '$$ medio' },
  { value: '$$$', label: '$$$ mais especial' },
  { value: '$$$$', label: '$$$$ premium' },
]

function locationLabel(place: Pick<SavedPlace, 'city' | 'neighborhood'>) {
  return [place.neighborhood, place.city].filter(Boolean).join(' - ') || 'Local a definir'
}

function priceLabel(priceBand: SavedPlace['priceBand']) {
  return PRICE_OPTIONS.find((option) => option.value === priceBand)?.label ?? 'Sem faixa'
}

function coverLetters(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function MyPlacesView({
  currentUser,
  onToast,
  onUseAsSuggestion,
}: Props) {
  const [items, setItems] = useState<Array<SavedPlace>>(() =>
    listSavedPlaces(currentUser),
  )
  const [showSheet, setShowSheet] = useState(false)
  const [editing, setEditing] = useState<SavedPlace | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const reload = useCallback(() => {
    setItems(listSavedPlaces(currentUser))
  }, [currentUser])

  useEffect(() => {
    const timer = window.setTimeout(reload, 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  function handleCreateClick() {
    setEditing(null)
    setPendingDeleteId(null)
    setShowSheet(true)
  }

  function handleEdit(place: SavedPlace) {
    setEditing(place)
    setPendingDeleteId(null)
    setShowSheet(true)
  }

  function handleRequestDelete(placeId: string) {
    setPendingDeleteId((current) => (current === placeId ? null : placeId))
  }

  function handleDelete(place: SavedPlace) {
    deleteSavedPlace(place.id)
    setPendingDeleteId(null)
    reload()
    onToast('Lugar removido da sua lista privada.')
  }

  return (
    <div className="places-mobile">
      <header className="places-header">
        <div className="places-header__copy">
          <span className="home-block__eyebrow">Lista privada</span>
          <h2 className="places-header__title">Meus lugares</h2>
          <p className="places-header__text">
            Guarde ideias so suas e transforme uma delas em sugestao quando decidir.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--primary places-header__action"
          onClick={handleCreateClick}
        >
          <Icon name="plus" size={15} />
          Adicionar lugar
        </button>
      </header>

      <section className="places-private-banner" aria-label="Aviso de privacidade">
        <span className="places-private-banner__icon" aria-hidden="true">
          <Icon name="bookmark" size={16} />
        </span>
        <div className="places-private-banner__copy">
          <strong>So voce ve esta lista</strong>
          <span>
            Nada daqui aparece para o grupo ate voce tocar em "Usar como sugestao".
          </span>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="home-empty places-empty">
          <div className="home-empty__icon" aria-hidden="true">
            <Icon name="bookmark" size={24} />
          </div>
          <div className="home-empty__title">Sua lista privada ainda esta vazia.</div>
          <div className="home-empty__text">
            Salve lugares, ideias e referencias para nao depender da memoria na
            hora de sugerir algo para a turma.
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleCreateClick}
          >
            <Icon name="plus" size={16} />
            Adicionar primeiro lugar
          </button>
        </div>
      ) : (
        <div className="saved-place-list" aria-label="Lugares salvos">
          {items.map((place) => (
            <SavedPlaceCard
              key={place.id}
              place={place}
              isDeletePending={pendingDeleteId === place.id}
              onEdit={() => handleEdit(place)}
              onDeleteRequest={() => handleRequestDelete(place.id)}
              onDeleteConfirm={() => handleDelete(place)}
              onDeleteCancel={() => setPendingDeleteId(null)}
              onUseAsSuggestion={() => onUseAsSuggestion(place)}
            />
          ))}
        </div>
      )}

      {showSheet ? (
        <SavedPlaceSheet
          editing={editing}
          currentUser={currentUser}
          onClose={() => setShowSheet(false)}
          onSaved={() => {
            setShowSheet(false)
            reload()
            onToast(editing ? 'Lugar atualizado.' : 'Lugar salvo na sua lista.')
          }}
          onToast={onToast}
        />
      ) : null}
    </div>
  )
}

type SavedPlaceCardProps = {
  place: SavedPlace
  isDeletePending: boolean
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  onUseAsSuggestion: () => void
}

function SavedPlaceCard({
  place,
  isDeletePending,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onUseAsSuggestion,
}: SavedPlaceCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  function handleEditClick() {
    setShowMenu(false)
    onEdit()
  }

  function handleDeleteClick() {
    setShowMenu(false)
    onDeleteRequest()
  }

  return (
    <article className="saved-place-card">
      <div className="saved-place-card__main">
        <div className="saved-place-card__media">
          {place.photoUrl ? (
            <img src={place.photoUrl} alt={place.name} />
          ) : (
            <div className="saved-place-card__placeholder">{coverLetters(place.name)}</div>
          )}
        </div>

        <div className="saved-place-card__body">
          <div className="saved-place-card__topline">
            <div className="saved-place-card__badges">
              <span className="chip chip--sm chip--primary">
                {place.kind || 'Sem tipo'}
              </span>
              <span className="chip chip--sm">{priceLabel(place.priceBand)}</span>
            </div>

            <div className="saved-place-card__menu-anchor">
              <button
                type="button"
                className="saved-place-card__menu-button"
                onClick={() => setShowMenu((current) => !current)}
                aria-label="Abrir acoes"
                aria-expanded={showMenu}
              >
                <Icon name="more-horizontal" size={18} />
              </button>

              {showMenu ? (
                <div className="saved-place-card__menu" role="menu">
                  <button
                    type="button"
                    className="saved-place-card__menu-item"
                    onClick={handleEditClick}
                  >
                    <Icon name="edit" size={15} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="saved-place-card__menu-item saved-place-card__menu-item--danger"
                    onClick={handleDeleteClick}
                  >
                    <Icon name="trash" size={15} />
                    Remover
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="saved-place-card__copy">
            <h3 className="saved-place-card__title">{place.name}</h3>
          </div>

          <div className="saved-place-card__meta">
            <span>
              <Icon name="pin" size={13} />
              {locationLabel(place)}
            </span>
          </div>
        </div>
      </div>

      <div className="saved-place-card__actions">
        <button
          type="button"
          className="btn btn--primary btn--block saved-place-card__suggest"
          onClick={onUseAsSuggestion}
        >
          <Icon name="sparkle" size={15} />
          Usar como sugestao
        </button>
      </div>

      {isDeletePending ? (
        <div className="saved-place-card__danger">
          <p>
            Remover este lugar da sua lista privada? Isso nao envia nada para o
            grupo, so apaga o item salvo.
          </p>
          <div className="saved-place-card__danger-actions">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={onDeleteCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={onDeleteConfirm}
            >
              Confirmar remocao
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

type SheetProps = {
  editing: SavedPlace | null
  currentUser: string
  onClose: () => void
  onSaved: () => void
  onToast: (message: string, variant?: 'info' | 'error') => void
}

function SavedPlaceSheet({
  editing,
  currentUser,
  onClose,
  onSaved,
  onToast,
}: SheetProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [kind, setKind] = useState(editing?.kind ?? '')
  const [city, setCity] = useState(editing?.city ?? 'Sao Paulo')
  const [neighborhood, setNeighborhood] = useState(editing?.neighborhood ?? '')
  const [priceBand, setPriceBand] = useState<SavedPlace['priceBand']>(
    editing?.priceBand ?? '',
  )
  const [note, setNote] = useState(editing?.note ?? '')
  const [photoUrl, setPhotoUrl] = useState(editing?.photoUrl ?? '')
  const [saving, setSaving] = useState(false)

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const url = await fileToCompressedDataUrl(file)
      setPhotoUrl(url)
    } catch {
      onToast('Nao consegui carregar essa foto.', 'error')
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      onToast('Da um nome para esse lugar.', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        kind: kind.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        priceBand,
        note: note.trim(),
        photoUrl,
      }

      if (editing) {
        updateSavedPlace(editing.id, payload)
      } else {
        createSavedPlace({
          owner: currentUser,
          ...payload,
        })
      }

      onSaved()
    } catch (error) {
      console.error(error)
      onToast('Nao consegui salvar agora.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet saved-place-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Editar lugar salvo' : 'Adicionar lugar privado'}
      >
        <div className="sheet__handle" aria-hidden="true" />

        <div className="sheet__header">
          <div>
            <span className="sheet__eyebrow">Privado</span>
            <h2 className="sheet__title">
              {editing ? 'Editar lugar salvo' : 'Adicionar lugar'}
            </h2>
            <p className="sheet__sub">
              Isso fica so na sua lista pessoal ate voce decidir usar como
              sugestao para o grupo.
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

        <form className="form" onSubmit={handleSubmit}>
          <section className="form-card form-card--flat saved-place-sheet__card">
            <div className="form-group">
              <label>Foto opcional</label>
              <label className="photo-picker">
                {photoUrl ? (
                  <img src={photoUrl} alt="" />
                ) : (
                  <span className="photo-picker__empty">
                    <Icon name="image" size={20} />
                    Toque para escolher uma foto.
                  </span>
                )}
                <input type="file" accept="image/*" onChange={handlePhoto} />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="sp-name">Nome</label>
              <input
                id="sp-name"
                className="input"
                type="text"
                placeholder="Jantar no bar com varanda"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sp-description">Descricao curta</label>
              <textarea
                id="sp-description"
                className="textarea"
                placeholder="Lugar bom para conversar, comer e nao depender de reserva complicada."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <div className="chip-select">
                {KIND_OPTIONS.map((option) => (
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

            <div className="saved-place-sheet__location">
              <div className="form-group">
                <label htmlFor="sp-city">Cidade</label>
                <input
                  id="sp-city"
                  className="input"
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sp-neighborhood">Bairro ou regiao</label>
                <input
                  id="sp-neighborhood"
                  className="input"
                  type="text"
                  placeholder="Pinheiros"
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                />
              </div>
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
              <label htmlFor="sp-note">Observacao pessoal</label>
              <textarea
                id="sp-note"
                className="textarea"
                placeholder="Lembrar da varanda, do horario mais vazio ou do motivo de ter salvo esse lugar."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <span className="form-group__hint">
                Isso continua privado e nao entra automaticamente na sugestao
                publica.
              </span>
            </div>
          </section>

          <div className="sheet__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar lugar'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
