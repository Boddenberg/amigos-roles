import { Icon } from './Icon'

export type TabKey = 'home' | 'suggest' | 'places' | 'profile'

type BottomNavProps = {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: Array<{
  key: TabKey
  label: string
  icon: 'home' | 'sparkle' | 'bookmark' | 'user'
}> = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'suggest', label: 'Sugestões', icon: 'sparkle' },
  { key: 'places', label: 'Meus lugares', icon: 'bookmark' },
  { key: 'profile', label: 'Perfil', icon: 'user' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegação">
      <div className="bottom-nav__inner">
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`bottom-nav__item${
                isActive ? ' bottom-nav__item--active' : ''
              }`}
              onClick={() => onChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottom-nav__icon" aria-hidden="true">
                <Icon
                  name={tab.icon}
                  size={22}
                  strokeWidth={isActive ? 2 : 1.6}
                />
              </span>
              <span className="bottom-nav__label">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
