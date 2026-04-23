import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
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

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      update('photoUrl', dataUrl)
    } catch {
      onToast('Não consegui carregar essa foto.', 'error')
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await saveProfile(form)
      await onSaved(saved)
      onToast('Perfil salvo.')
      setDirty(false)
    } catch (error) {
      console.error(error)
      onToast('Não consegui salvar o perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const location =
    [form.neighborhood, form.city].filter(Boolean).join(' · ') || 'Sem cidade ainda'

  return (
    <div className="profile-view">
      <section className="profile-summary">
        <div className="profile-summary__hero">
          <div className="photo-upload">
            <Avatar name={form.displayName} photoUrl={form.photoUrl} size="xl" />
            <label className="photo-upload__edit" aria-label="Trocar foto">
              <Icon name="edit" size={14} />
              <input
                className="photo-upload__input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          <div className="profile-summary__copy">
            <span className="eyebrow">Como a turma te vê</span>
            <h2 className="profile-summary__title">
              {form.nickname || form.displayName}
            </h2>
            <p className="profile-summary__text">{location}</p>
          </div>
        </div>

        <div className="profile-summary__stats">
          <div className="profile-summary__stat">
            <strong>{suggestionsCount}</strong>
            <span>sugestões</span>
          </div>
          <div className="profile-summary__stat">
            <strong>{confirmedCount}</strong>
            <span>rolês confirmados</span>
          </div>
        </div>
      </section>

      <form className="form profile-form" onSubmit={(event) => event.preventDefault()}>
        <section className="form-card">
          <div className="form-card__header">
            <div>
              <h3 className="form-card__title">Identidade</h3>
              <p className="form-card__sub">
                O básico para a galera reconhecer rápido quem sugeriu ou confirmou.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile-nickname">Apelido</label>
            <input
              id="profile-nickname"
              className="input"
              type="text"
              value={form.nickname}
              onChange={(event) => update('nickname', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-birth">Data de nascimento</label>
            <input
              id="profile-birth"
              className="input"
              type="date"
              value={form.birthDate}
              onChange={(event) => update('birthDate', event.target.value)}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="form-card__header">
            <div>
              <h3 className="form-card__title">Onde você fica</h3>
              <p className="form-card__sub">
                Facilita combinar encontros e entender deslocamentos.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile-city">Cidade</label>
            <input
              id="profile-city"
              className="input"
              type="text"
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-neighborhood">Bairro</label>
            <input
              id="profile-neighborhood"
              className="input"
              type="text"
              value={form.neighborhood}
              onChange={(event) => update('neighborhood', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-address">Endereço</label>
            <input
              id="profile-address"
              className="input"
              type="text"
              placeholder="Rua, número, complemento..."
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
            />
          </div>
        </section>

        <div className="profile-actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>

          <button
            type="button"
            className="btn btn--secondary btn--block"
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
