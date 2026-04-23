import { useMemo, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import {
  AI_PITACOS,
  getRolePresentation,
  type AiSuggestion,
} from '../lib/homePresentation'
import type { Profile, RoleWithPlace } from '../lib/storage'

type HomeViewProps = {
  roles: Array<RoleWithPlace>
  profiles: Array<Profile>
  onGoToSuggest: () => void
  onOpenDetails: (role: RoleWithPlace) => void
}

type RoleStatus = {
  label: string
  tone: 'mint' | 'sun'
}

function shortDate(iso: string) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function isFuture(iso: string) {
  const target = new Date(`${iso}T23:59:59`).getTime()
  return target >= Date.now()
}

function monthStartTs() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function coverLetters(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function computeStatus(role: RoleWithPlace, totalFriends: number): RoleStatus {
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

export function HomeView({
  roles,
  profiles,
  onGoToSuggest,
  onOpenDetails,
}: HomeViewProps) {
  const [aiIndex, setAiIndex] = useState(0)

  const profileByName = useMemo(() => {
    const map = new Map<string, Profile>()
    for (const profile of profiles) map.set(profile.name, profile)
    return map
  }, [profiles])

  const totalFriends = Math.max(profiles.length, 1)
  const upcoming = useMemo(
    () =>
      roles
        .filter((role) => isFuture(role.date))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [roles],
  )

  const hero = useMemo(() => {
    const confirmedUpcoming = upcoming.filter((role) => role.stage !== 'suggested')
    const withConfirmations = upcoming.filter(
      (role) => role.confirmations.length >= 1,
    )

    return (
      confirmedUpcoming[0] ??
      [...withConfirmations].sort(
        (a, b) =>
          b.confirmations.length - a.confirmations.length ||
          a.date.localeCompare(b.date),
      )[0] ??
      upcoming[0] ??
      null
    )
  }, [upcoming])

  const sinceMonth = monthStartTs()
  const monthlySuggestions = useMemo(() => {
    const currentMonth = roles
      .filter((role) => new Date(role.createdAt).getTime() >= sinceMonth)
      .sort((a, b) => a.date.localeCompare(b.date))

    const fallback = upcoming
    const source = currentMonth.length >= 2 ? currentMonth : fallback

    return source.filter((role) => !hero || role.id !== hero.id).slice(0, 6)
  }, [hero, roles, sinceMonth, upcoming])

  const suggesters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const role of roles) {
      counts.set(role.suggestedBy, (counts.get(role.suggestedBy) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([name, suggestionsCount]) => ({
        name,
        suggestionsCount,
        profile: profileByName.get(name),
      }))
      .sort((a, b) => b.suggestionsCount - a.suggestionsCount || a.name.localeCompare(b.name))
  }, [profileByName, roles])

  const suggestionsThisMonth = roles.filter(
    (role) => new Date(role.createdAt).getTime() >= sinceMonth,
  ).length
  const chosenCount = roles.filter((role) => role.stage !== 'suggested').length
  const aiSuggestion: AiSuggestion = AI_PITACOS[aiIndex % AI_PITACOS.length]

  return (
    <div className="home-mobile">
      <HomeHeader onCreate={onGoToSuggest} />

      {hero ? (
        <FeaturedRoleCard
          role={hero}
          profileByName={profileByName}
          onOpen={() => onOpenDetails(hero)}
        />
      ) : (
        <div className="home-empty">
          <div className="home-empty__icon" aria-hidden="true">
            <Icon name="calendar" size={24} />
          </div>
          <div className="home-empty__title">Ainda não tem próximo rolê</div>
          <div className="home-empty__text">
            Crie a primeira sugestão e já deixe a home com cara de plano real.
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={onGoToSuggest}
          >
            <Icon name="plus" size={16} />
            Nova sugestão
          </button>
        </div>
      )}

      <section className="home-block">
        <div className="home-block__header">
          <div>
            <div className="home-block__eyebrow">Sugestões do mês</div>
            <h2 className="home-block__title">Ideias para o próximo encontro</h2>
          </div>
          <span className="home-block__meta">
            {monthlySuggestions.length} no radar
          </span>
        </div>

        {monthlySuggestions.length === 0 ? (
          <div className="home-empty home-empty--soft">
            <div className="home-empty__title">Nenhuma outra sugestão ainda</div>
            <div className="home-empty__text">
              Quando entrarem novas ideias, elas aparecem aqui em formato mobile.
            </div>
          </div>
        ) : (
          <div className="monthly-carousel" aria-label="Sugestões do mês">
            {monthlySuggestions.map((role) => (
              <MonthlySuggestionCard
                key={role.id}
                role={role}
                profileByName={profileByName}
                totalFriends={totalFriends}
                onOpen={() => onOpenDetails(role)}
              />
            ))}
          </div>
        )}
      </section>

      <AiSuggestionCard
        suggestion={aiSuggestion}
        onRefresh={() => setAiIndex((current) => current + 1)}
      />

      <section className="home-block">
        <div className="home-block__header">
          <div>
            <div className="home-block__eyebrow">Quem já sugeriu</div>
            <h2 className="home-block__title">A turma que puxou ideias</h2>
          </div>
        </div>

        {suggesters.length === 0 ? (
          <div className="home-empty home-empty--soft">
            <div className="home-empty__text">
              Assim que alguém sugerir um rolê, aparece aqui.
            </div>
          </div>
        ) : (
          <div className="suggester-strip" aria-label="Quem já sugeriu">
            {suggesters.map(({ name, profile, suggestionsCount }) => (
              <div className="suggester-pill" key={name}>
                <Avatar
                  name={profile?.displayName ?? name}
                  photoUrl={profile?.photoUrl}
                  size="sm"
                />
                <div className="suggester-pill__body">
                  <strong>{profile?.displayName ?? name}</strong>
                  <span>
                    {suggestionsCount} {suggestionsCount === 1 ? 'sugestão' : 'sugestões'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="home-block">
        <div className="home-block__header">
          <div>
            <div className="home-block__eyebrow">Resumo</div>
            <h2 className="home-block__title">Visão rápida do app</h2>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-card__label">Amigos</span>
            <strong>{profiles.length}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">Sugestões do mês</span>
            <strong>{suggestionsThisMonth}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-card__label">Rolê escolhido</span>
            <strong>{chosenCount}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

type HomeHeaderProps = {
  onCreate: () => void
}

function HomeHeader({ onCreate }: HomeHeaderProps) {
  return (
    <header className="home-header">
      <div className="home-header__brand">
        <span className="home-header__brand-mark" aria-hidden="true">
          Ay
        </span>
        <span className="home-header__brand-name">Amigos yTubers Rolês</span>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--sm home-header__action"
        onClick={onCreate}
      >
        <Icon name="plus" size={15} />
        Nova sugestão
      </button>
    </header>
  )
}

type FeaturedRoleCardProps = {
  role: RoleWithPlace
  profileByName: Map<string, Profile>
  onOpen: () => void
}

function FeaturedRoleCard({
  role,
  profileByName,
  onOpen,
}: FeaturedRoleCardProps) {
  const suggester = profileByName.get(role.suggestedBy)

  return (
    <article className="spotlight-card">
      <div className="spotlight-card__media">
        {role.place?.photoUrl ? (
          <img src={role.place.photoUrl} alt={role.place.name} />
        ) : (
          <div className="spotlight-card__placeholder">{coverLetters(role.title)}</div>
        )}
      </div>

      <div className="spotlight-card__body">
        <span className="spotlight-card__eyebrow">Próximo rolê</span>
        <h2 className="spotlight-card__title">{role.title}</h2>

        <div className="spotlight-card__date">
          <Icon name="calendar" size={14} />
          <span>{shortDate(role.date)}</span>
        </div>

        <div className="spotlight-card__suggester">
          <Avatar
            name={suggester?.displayName ?? role.suggestedBy}
            photoUrl={suggester?.photoUrl}
            size="xs"
          />
          <span>
            Sugerido por <strong>{suggester?.displayName ?? role.suggestedBy}</strong>
          </span>
        </div>

        <button type="button" className="btn btn--secondary btn--block" onClick={onOpen}>
          Ver detalhes
        </button>
      </div>
    </article>
  )
}

type MonthlySuggestionCardProps = {
  role: RoleWithPlace
  profileByName: Map<string, Profile>
  totalFriends: number
  onOpen: () => void
}

function MonthlySuggestionCard({
  role,
  profileByName,
  totalFriends,
  onOpen,
}: MonthlySuggestionCardProps) {
  const suggester = profileByName.get(role.suggestedBy)
  const status = computeStatus(role, totalFriends)
  const presentation = getRolePresentation(role)

  return (
    <button type="button" className="monthly-card" onClick={onOpen}>
      <div className="monthly-card__image">
        {role.place?.photoUrl ? (
          <img src={role.place.photoUrl} alt="" />
        ) : (
          <div className="monthly-card__placeholder">{coverLetters(role.title)}</div>
        )}
      </div>

      <div className="monthly-card__body">
        <div className="monthly-card__badges">
          <span className="chip chip--sm chip--primary">{presentation.kind}</span>
          <span
            className={`chip chip--sm ${
              status.tone === 'mint' ? 'chip--mint' : 'chip--sun'
            }`}
          >
            {status.label}
          </span>
        </div>

        <h3 className="monthly-card__title">{role.title}</h3>

        <div className="monthly-card__meta">
          <span>
            <Icon name="pin" size={13} />
            {presentation.locationShort}
          </span>
          <span>{presentation.priceBand}</span>
        </div>

        <div className="monthly-card__footer">
          <span className="monthly-card__author">
            <Avatar
              name={suggester?.displayName ?? role.suggestedBy}
              photoUrl={suggester?.photoUrl}
              size="xs"
            />
            <span>{suggester?.displayName ?? role.suggestedBy}</span>
          </span>

          <span className="monthly-card__date">{shortDate(role.date)}</span>
        </div>
      </div>
    </button>
  )
}

type AiSuggestionCardProps = {
  suggestion: AiSuggestion
  onRefresh: () => void
}

function AiSuggestionCard({ suggestion, onRefresh }: AiSuggestionCardProps) {
  return (
    <section className="ai-pitaco">
      <div className="ai-pitaco__header">
        <span className="ai-pitaco__icon" aria-hidden="true">
          <Icon name="sparkle" size={16} />
        </span>
        <div>
          <div className="home-block__eyebrow">Pitaco da IA</div>
          <h2 className="home-block__title home-block__title--compact">
            {suggestion.title}
          </h2>
        </div>
      </div>

      <p className="ai-pitaco__text">{suggestion.suggestion}</p>

      <div className="ai-pitaco__tags">
        {suggestion.tags.map((tag) => (
          <span className="chip chip--sm chip--accent" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <button type="button" className="btn btn--secondary btn--block" onClick={onRefresh}>
        <Icon name="sparkle" size={15} />
        Gerar outra ideia
      </button>
    </section>
  )
}
