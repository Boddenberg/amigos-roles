import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { Avatar } from './components/Avatar'
import { BottomNav } from './components/BottomNav'
import type { TabKey } from './components/BottomNav'
import { LoginScreen } from './components/LoginScreen'
import { RoleDetailsModal } from './components/RoleDetailsModal'
import { getCurrentUser, logout } from './lib/auth'
import type { LoggedUser } from './lib/auth'
import {
  deleteRole,
  listPlaces,
  listProfiles,
  listRolesWithPlaces,
  toggleConfirmation,
} from './lib/storage'
import type { Place, Profile, RoleWithPlace } from './lib/storage'
import type { SavedPlace } from './lib/savedPlaces'
import { HomeView } from './views/HomeView'
import { MyPlacesView } from './views/MyPlacesView'
import { ProfileView } from './views/ProfileView'
import { SuggestView } from './views/SuggestView'
import type { SuggestPrefill } from './views/SuggestView'

type Toast = { id: number; message: string; variant: 'info' | 'error' }

const TAB_COPY: Record<TabKey, { label: string; description: string }> = {
  home: {
    label: 'Agenda da turma',
    description:
      'Acompanhe o proximo encontro, veja o que esta ganhando forca e mantenha as ideias do grupo organizadas.',
  },
  suggest: {
    label: 'Nova sugestao',
    description:
      'Monte uma proposta bonita, clara e rapida de votar, sem deixar o fluxo pesado.',
  },
  places: {
    label: 'Meus lugares',
    description:
      'Sua lista privada de ideias e lugares para guardar agora e sugerir so quando fizer sentido.',
  },
  profile: {
    label: 'Seu perfil',
    description:
      'Ajuste como voce aparece para a galera e mantenha suas informacoes sempre prontas para combinar roles.',
  },
}

function fallbackProfile(name: string): Profile {
  return {
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    nickname: name.charAt(0).toUpperCase() + name.slice(1),
    photoUrl: '',
    birthDate: '',
    city: 'Sao Paulo',
    neighborhood: '',
    address: '',
    updatedAt: new Date().toISOString(),
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<LoggedUser | null>(() =>
    getCurrentUser(),
  )
  const [tab, setTab] = useState<TabKey>('home')
  const [profiles, setProfiles] = useState<Array<Profile>>([])
  const [places, setPlaces] = useState<Array<Place>>([])
  const [roles, setRoles] = useState<Array<RoleWithPlace>>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [detailsRoleId, setDetailsRoleId] = useState<string | null>(null)
  const [suggestPrefill, setSuggestPrefill] = useState<SuggestPrefill | null>(
    null,
  )
  const [suggestSessionKey, setSuggestSessionKey] = useState(0)

  const showToast = useCallback(
    (message: string, variant: 'info' | 'error' = 'info') => {
      setToast({ id: Date.now(), message, variant })
    },
    [],
  )

  const reloadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [profilesData, placesData, rolesData] = await Promise.all([
        listProfiles(),
        listPlaces(),
        listRolesWithPlaces(),
      ])
      setProfiles(profilesData)
      setPlaces(placesData)
      setRoles(rolesData)
    } catch (error) {
      console.error(error)
      showToast('Nao consegui carregar os dados do grupo.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (!currentUser) return
    const timer = window.setTimeout(() => {
      void reloadAll()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [currentUser, reloadAll])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  function handleLogout() {
    logout()
    setCurrentUser(null)
    setSuggestPrefill(null)
    setTab('home')
  }

  function openSuggestFlow(prefill: SuggestPrefill | null = null) {
    setSuggestPrefill(prefill)
    setSuggestSessionKey((current) => current + 1)
    setTab('suggest')
  }

  function handleTabChange(nextTab: TabKey) {
    if (nextTab === 'suggest') {
      openSuggestFlow()
      return
    }

    setSuggestPrefill(null)
    setTab(nextTab)
  }

  async function handleToggleConfirmation(roleId: string) {
    if (!currentUser) return
    try {
      await toggleConfirmation(roleId, currentUser.name)
      await reloadAll()
    } catch (error) {
      console.error(error)
      showToast('Nao consegui confirmar agora.', 'error')
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!currentUser) return
    const target = roles.find((role) => role.id === roleId)
    if (!target) return

    if (target.suggestedBy !== currentUser.name) {
      showToast('So quem sugeriu pode excluir esse role.', 'error')
      return
    }

    try {
      await deleteRole(roleId)
      setDetailsRoleId(null)
      await reloadAll()
      showToast('Role excluido.')
    } catch (error) {
      console.error(error)
      showToast('Nao consegui excluir agora.', 'error')
    }
  }

  function handleUseSavedAsSuggestion(saved: SavedPlace) {
    openSuggestFlow({
      mode: 'saved',
      savedPlaceId: saved.id,
      source: {
        kind: 'saved-place',
        label: saved.name,
      },
    })
    showToast('Escolha a data e publique quando quiser.')
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setCurrentUser(user)
          setTab('home')
        }}
      />
    )
  }

  const profile =
    profiles.find((item) => item.name === currentUser.name) ??
    fallbackProfile(currentUser.name)

  const mySuggestionsCount = roles.filter(
    (role) => role.suggestedBy === currentUser.name,
  ).length
  const myConfirmedCount = roles.filter(
    (role) =>
      role.stage !== 'suggested' && role.confirmations.includes(currentUser.name),
  ).length
  const displayName = profile.nickname || currentUser.displayName
  const currentTabCopy = TAB_COPY[tab]
  const detailsRole =
    (detailsRoleId && roles.find((role) => role.id === detailsRoleId)) || null
  const isHomeTab = tab === 'home'
  const isSuggestTab = tab === 'suggest'
  const isPlacesTab = tab === 'places'
  const isProfileTab = tab === 'profile'
  const usesCustomChrome =
    isHomeTab || isSuggestTab || isPlacesTab || isProfileTab

  return (
    <div className="page-shell">
      <div className="page-shell__glow page-shell__glow--peach" aria-hidden="true" />
      <div className="page-shell__glow page-shell__glow--mint" aria-hidden="true" />

      <main className={`app-shell${usesCustomChrome ? ' app-shell--home' : ''}`}>
        {usesCustomChrome ? null : (
          <>
            <header className="top-bar">
              <div className="top-bar__brand-group">
                <span className="top-bar__brand-mark" aria-hidden="true">
                  Ay
                </span>
                <div className="top-bar__brand-copy">
                  <span className="top-bar__eyebrow">Amigos yTubers Roles</span>
                  <span className="top-bar__brand">
                    planejando o proximo encontro
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="top-bar__profile-button"
                onClick={() => setTab('profile')}
                aria-label="Abrir perfil"
              >
                <span
                  className={`status-pill${loading ? ' status-pill--live' : ''}`}
                >
                  {loading ? 'Sincronizando' : currentTabCopy.label}
                </span>
                <Avatar
                  name={profile.displayName}
                  photoUrl={profile.photoUrl}
                  size="sm"
                />
              </button>
            </header>

            <section className="app-intro" aria-label="Resumo da tela atual">
              <span className="app-intro__eyebrow">Oi, {displayName}</span>
              <p className="app-intro__title">{currentTabCopy.label}</p>
              <p className="app-intro__text">{currentTabCopy.description}</p>
            </section>
          </>
        )}

        <div className={`app-panel${usesCustomChrome ? ' app-panel--home' : ''}`}>
          {tab === 'home' ? (
            <HomeView
              roles={roles}
              profiles={profiles}
              onGoToSuggest={() => openSuggestFlow()}
              onOpenDetails={(role) => setDetailsRoleId(role.id)}
            />
          ) : null}

          {tab === 'suggest' ? (
            <SuggestView
              key={suggestSessionKey}
              currentUser={currentUser.name}
              places={places}
              prefill={suggestPrefill}
              onCreated={async () => {
                await reloadAll()
                setSuggestPrefill(null)
              }}
              onToast={showToast}
              onOpenPlaces={() => {
                setSuggestPrefill(null)
                setTab('places')
              }}
              onCancel={() => {
                const targetTab =
                  suggestPrefill?.source?.kind === 'saved-place' ? 'places' : 'home'
                setSuggestPrefill(null)
                setTab(targetTab)
              }}
            />
          ) : null}

          {tab === 'places' ? (
            <MyPlacesView
              currentUser={currentUser.name}
              onToast={showToast}
              onUseAsSuggestion={handleUseSavedAsSuggestion}
            />
          ) : null}

          {tab === 'profile' ? (
            <ProfileView
              profile={profile}
              suggestionsCount={mySuggestionsCount}
              confirmedCount={myConfirmedCount}
              onSaved={reloadAll}
              onLogout={handleLogout}
              onToast={showToast}
            />
          ) : null}
        </div>
      </main>

      <BottomNav active={tab} onChange={handleTabChange} />

      {detailsRole ? (
        <RoleDetailsModal
          role={detailsRole}
          profiles={profiles}
          currentUser={currentUser.name}
          onClose={() => setDetailsRoleId(null)}
          onToggleConfirmation={handleToggleConfirmation}
          onDelete={handleDeleteRole}
        />
      ) : null}

      {toast ? (
        <div
          className={`toast${toast.variant === 'error' ? ' toast--error' : ''}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

export default App
