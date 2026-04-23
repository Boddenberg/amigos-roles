import { useState } from 'react'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { getRolePresentation } from '../lib/homePresentation'
import type { Profile, RoleWithPlace } from '../lib/storage'

type Props = {
  role: RoleWithPlace
  profiles: Array<Profile>
  currentUser: string
  onClose: () => void
  onToggleConfirmation: (roleId: string) => void
  onDelete: (roleId: string) => void
}

type Status = { label: string; tone: 'mint' | 'sun' }

function formatFullDate(iso: string) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function coverLetters(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function computeStatus(role: RoleWithPlace, totalFriends: number): Status {
  if (role.stage === 'done') return { label: 'Rolou', tone: 'mint' }
  if (role.stage === 'confirmed') return { label: 'Confirmado', tone: 'mint' }

  const count = role.confirmations.length
  if (totalFriends > 0 && count >= totalFriends) {
    return { label: 'Todo mundo topou', tone: 'mint' }
  }

  const majority = Math.ceil(totalFriends / 2)
  if (majority > 0 && count >= majority) {
    return { label: 'Bora!', tone: 'mint' }
  }

  return { label: 'Em votação', tone: 'sun' }
}

export function RoleDetailsModal({
  role,
  profiles,
  currentUser,
  onClose,
  onToggleConfirmation,
  onDelete,
}: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const profileByName = new Map(profiles.map((profile) => [profile.name, profile]))
  const suggester = profileByName.get(role.suggestedBy)
  const isConfirmed = role.confirmations.includes(currentUser)
  const isOwner = role.suggestedBy === currentUser
  const totalFriends = Math.max(profiles.length, 1)
  const status = computeStatus(role, totalFriends)
  const presentation = getRolePresentation(role)

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />

      <div className="sheet role-sheet" role="dialog" aria-modal="true" aria-label="Detalhes do rolê">
        <div className="sheet__handle" aria-hidden="true" />

        <div className="role-sheet__hero">
          {role.place?.photoUrl ? (
            <img src={role.place.photoUrl} alt={role.place.name} />
          ) : (
            <div className="role-sheet__hero-placeholder">{coverLetters(role.title)}</div>
          )}

          <button
            type="button"
            className="role-sheet__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="role-sheet__content">
          <div className="role-sheet__header">
            <div>
              <div className="role-sheet__eyebrow">Detalhes do rolê</div>
              <h2 className="role-sheet__title">{role.title}</h2>
            </div>

            <span
              className={`chip chip--sm ${
                status.tone === 'mint' ? 'chip--mint' : 'chip--sun'
              }`}
            >
              {status.label}
            </span>
          </div>

          <p className="role-sheet__description">{presentation.cleanDescription}</p>

          <div className="role-sheet__grid">
            <DetailField label="Tipo" value={presentation.kind} />
            <DetailField label="Faixa de preço" value={presentation.priceLabel} />
            <DetailField label="Local" value={presentation.locationLabel} />
            <DetailField label="Data" value={formatFullDate(role.date)} />
            <DetailField
              label="Quem sugeriu"
              value={suggester?.displayName ?? role.suggestedBy}
              avatar={{
                name: suggester?.displayName ?? role.suggestedBy,
                photoUrl: suggester?.photoUrl,
              }}
            />
            <DetailField
              label="Status"
              value={`${status.label} · ${role.confirmations.length}/${totalFriends} topam`}
            />
          </div>

          <div className="role-sheet__actions">
            <button
              type="button"
              className={`btn ${isConfirmed ? 'btn--soft' : 'btn--primary'}`}
              onClick={() => onToggleConfirmation(role.id)}
            >
              {isConfirmed ? 'Sair do rolê' : 'Tô dentro!'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Fechar
            </button>
          </div>

          {isOwner ? (
            <div className="role-sheet__danger">
              {confirmingDelete ? (
                <div className="role-sheet__danger-box">
                  <span className="role-sheet__danger-title">
                    Tem certeza? Esse rolê some da agenda.
                  </span>
                  <div className="role-sheet__danger-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => onDelete(role.id)}
                    >
                      Excluir rolê
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm btn--danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Excluir este rolê
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

type DetailFieldProps = {
  label: string
  value: string
  avatar?: {
    name: string
    photoUrl?: string
  }
}

function DetailField({ label, value, avatar }: DetailFieldProps) {
  return (
    <div className="role-sheet__field">
      <span className="role-sheet__field-label">{label}</span>
      {avatar ? (
        <span className="role-sheet__field-person">
          <Avatar name={avatar.name} photoUrl={avatar.photoUrl} size="xs" />
          <span>{value}</span>
        </span>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  )
}
