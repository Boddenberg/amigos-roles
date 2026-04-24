import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import folhasIllustration from '../../folhas.png'
import perfilBackground from '../../perfil.png'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { fileToCompressedDataUrl } from '../lib/photos'
import { saveProfile } from '../lib/storage'
import type { Profile } from '../lib/storage'

type ProfileViewProps = {
  profile: Profile
  suggestionsCount: number
  confirmedCount: number
  onSaved: (profile: Profile) => void | Promise<void>
  onLogout: () => void
  onToast: (message: string, variant?: 'info' | 'error') => void
}

function formatBirthDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function ProfileView({
  profile,
  suggestionsCount,
  confirmedCount,
  onSaved,
  onLogout,
  onToast,
}: ProfileViewProps) {
  const [form, setForm] = useState<Profile>(profile)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForm(profile)
      setDirty(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [profile])

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      displayName: value,
      nickname: value,
    }))
    setDirty(true)
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      update('photoUrl', dataUrl)
    } catch {
      onToast('Nao consegui carregar essa foto.', 'error')
    }
  }

  async function handleSave() {
    if (saving || !dirty) return
    setSaving(true)
    try {
      const saved = await saveProfile(form)
      await onSaved(saved)
      onToast('Perfil salvo.')
      setDirty(false)
    } catch (error) {
      console.error(error)
      onToast('Nao consegui salvar o perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const profileName = form.nickname || form.displayName || form.name
  const greetingName = profileName.trim().split(/\s+/).filter(Boolean)[0] || 'amigo'
  const location = form.city || 'Sem cidade ainda'

  return (
    <div className="profile-view profile-view--refresh">
      <header className="profile-topbar" aria-label="Cabecalho do perfil">
        <div className="profile-topbar__copy">
          <span className="profile-topbar__eyebrow">Amigos YTubers</span>
          <span className="profile-topbar__text">Planejando o proximo encontro</span>
        </div>

        <div className="profile-topbar__avatar" aria-hidden="true">
          <Avatar name={profileName} photoUrl={form.photoUrl} size="sm" />
          <span className="profile-topbar__status" />
        </div>
      </header>

      <section className="profile-hero-card">
        <img
          className="profile-hero-card__background"
          src={perfilBackground}
          alt=""
          aria-hidden="true"
        />
        <div className="profile-hero-card__copy">
          <span className="profile-hero-card__eyebrow">Oi, {greetingName}</span>
          <h1 className="profile-hero-card__title">Seu perfil</h1>
          <p className="profile-hero-card__text">
            Mantenha suas informacoes sempre atualizadas para deixar seus roles
            ainda melhores.
          </p>
        </div>
      </section>

      <form
        className="profile-form profile-form--refresh"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <section className="profile-showcase">
          <div className="profile-showcase__header">
            <div className="profile-showcase__photo">
              <div className="photo-upload">
                <Avatar name={profileName} photoUrl={form.photoUrl} size="xl" />
                <label
                  className="photo-upload__edit profile-showcase__edit"
                  aria-label="Trocar foto"
                >
                  <Icon name="edit" size={14} />
                  <input
                    className="photo-upload__input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            </div>

            <div className="profile-showcase__identity">
              <h2 className="profile-showcase__name">{profileName}</h2>
              <p className="profile-showcase__location">
                <Icon name="pin" size={16} />
                <span>{location}</span>
              </p>
            </div>
          </div>

          <div className="profile-showcase__stats">
            <article className="profile-stat-card profile-stat-card--mint">
              <span className="profile-stat-card__icon" aria-hidden="true">
                <Icon name="sparkle" size={18} />
              </span>
              <div className="profile-stat-card__copy">
                <strong>{suggestionsCount}</strong>
                <span>sugestoes</span>
              </div>
            </article>

            <article className="profile-stat-card profile-stat-card--peach">
              <span className="profile-stat-card__icon" aria-hidden="true">
                <Icon name="calendar" size={18} />
              </span>
              <div className="profile-stat-card__copy">
                <strong>{confirmedCount}</strong>
                <span>roles confirmados</span>
              </div>
            </article>
          </div>
        </section>

        <section className="profile-info-card">
          <div className="profile-info-card__header">
            <h3>Suas informacoes</h3>
          </div>

          <div className="profile-field-list">
            <div className="profile-field">
              <span className="profile-field__icon profile-field__icon--mint">
                <Icon name="user" size={18} />
              </span>
              <div className="profile-field__main">
                <label className="profile-field__label" htmlFor="profile-name">
                  Nome
                </label>
                <input
                  id="profile-name"
                  className="profile-field__input"
                  type="text"
                  autoComplete="name"
                  value={profileName}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
              </div>
              <span className="profile-field__tail" aria-hidden="true">
                <Icon name="chevron-right" size={18} />
              </span>
            </div>

            <div className="profile-field profile-field--date">
              <span className="profile-field__icon profile-field__icon--peach">
                <Icon name="calendar" size={18} />
              </span>
              <div className="profile-field__main">
                <label className="profile-field__label" htmlFor="profile-birth">
                  Data de nascimento
                </label>
                <span
                  className={`profile-field__value${
                    form.birthDate ? '' : ' profile-field__value--placeholder'
                  }`}
                >
                  {form.birthDate ? formatBirthDate(form.birthDate) : 'dd/mm/aaaa'}
                </span>
              </div>
              <span className="profile-field__tail" aria-hidden="true">
                <Icon name="calendar" size={18} />
              </span>
              <input
                id="profile-birth"
                className="profile-field__date-input"
                type="date"
                value={form.birthDate}
                onChange={(event) => update('birthDate', event.target.value)}
              />
            </div>

            <div className="profile-field">
              <span className="profile-field__icon profile-field__icon--mint">
                <Icon name="pin" size={18} />
              </span>
              <div className="profile-field__main">
                <label className="profile-field__label" htmlFor="profile-city">
                  Cidade
                </label>
                <input
                  id="profile-city"
                  className="profile-field__input"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                />
              </div>
              <span className="profile-field__tail" aria-hidden="true">
                <Icon name="chevron-right" size={18} />
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field__icon profile-field__icon--peach">
                <Icon name="home" size={18} />
              </span>
              <div className="profile-field__main">
                <label
                  className="profile-field__label"
                  htmlFor="profile-neighborhood"
                >
                  Bairro
                </label>
                <input
                  id="profile-neighborhood"
                  className="profile-field__input"
                  type="text"
                  autoComplete="address-level3"
                  value={form.neighborhood}
                  onChange={(event) => update('neighborhood', event.target.value)}
                />
              </div>
              <span className="profile-field__tail" aria-hidden="true">
                <Icon name="chevron-right" size={18} />
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field__icon profile-field__icon--mint">
                <Icon name="pin" size={18} />
              </span>
              <div className="profile-field__main">
                <label className="profile-field__label" htmlFor="profile-address">
                  Endereco
                </label>
                <input
                  id="profile-address"
                  className="profile-field__input"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Rua, numero, complemento..."
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                />
              </div>
              <span className="profile-field__tail" aria-hidden="true">
                <Icon name="chevron-right" size={18} />
              </span>
            </div>
          </div>

          <img className="profile-info-card__leaves" src={folhasIllustration} alt="" />
        </section>

        <div className="profile-actions">
          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg profile-action-button"
            disabled={!dirty || saving}
          >
            <Icon name="sparkle" size={16} />
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>

          <button
            type="button"
            className="btn btn--secondary btn--block btn--lg profile-action-button profile-action-button--secondary"
            onClick={onLogout}
          >
            <Icon name="log-out" size={16} />
            Sair da conta
          </button>
        </div>
      </form>
    </div>
  )
}
