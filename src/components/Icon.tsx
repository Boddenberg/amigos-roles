/**
 * Ícones SVG inline — estilo Lucide (stroke-based), 24×24, stroke 1.75
 * Leves, modernos e coerentes em qualquer tamanho.
 */

type IconProps = {
  size?: number
  className?: string
  strokeWidth?: number
}

type IconName =
  | 'calendar'
  | 'arrow-left'
  | 'pin'
  | 'check'
  | 'check-circle'
  | 'close'
  | 'edit'
  | 'image'
  | 'log-out'
  | 'vote'
  | 'users'
  | 'sparkle'
  | 'home'
  | 'plus'
  | 'user'
  | 'bookmark'
  | 'clock'
  | 'more-horizontal'
  | 'trash'
  | 'info'
  | 'chevron-right'
  | 'tag'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.75,
}: IconProps & { name: IconName }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    strokeWidth,
    'aria-hidden': true,
    className,
    ...base,
  }

  switch (name) {
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m12 5-7 7 7 7" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      )
    case 'check-circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.25" />
          <path d="M8 12.2 11 15.2 16 9.5" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6 18 18" />
          <path d="M18 6 6 18" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="m4 20 4.2-1 9.5-9.5a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" />
          <path d="m13.6 7.9 2.5 2.5" />
        </svg>
      )
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="3" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m21 15-4.2-4.2a1 1 0 0 0-1.4 0L8 18.2" />
        </svg>
      )
    case 'log-out':
      return (
        <svg {...common}>
          <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
          <path d="M10 17 15 12 10 7" />
          <path d="M15 12H4" />
        </svg>
      )
    case 'vote':
      // ícone simples: cédula com check
      return (
        <svg {...common}>
          <path d="M4 14.5 12 4l8 10.5" />
          <path d="M4 14.5V20h16v-5.5" />
          <path d="M9 14h6" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3.2" />
          <path d="M3 19c.5-3.5 3-5 6-5s5.5 1.5 6 5" />
          <circle cx="17" cy="8" r="2.6" />
          <path d="M16 13.2c2.8 0 4.6 1.4 5 4.3" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 17.7l-1.7-5.3L4.8 10.7 10.3 9Z" />
          <path d="M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
        </svg>
      )
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11.2 12 4l8 7.2" />
          <path d="M5.5 10v9.5a.5.5 0 0 0 .5.5h3.5v-5.5h5V20H18a.5.5 0 0 0 .5-.5V10" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.8" />
          <path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6" />
        </svg>
      )
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 4h12a1 1 0 0 1 1 1v15.2a.5.5 0 0 1-.78.41L12 16.5l-6.22 4.11A.5.5 0 0 1 5 20.2V5a1 1 0 0 1 1-1Z" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    case 'more-horizontal':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M10 3.8h4" />
          <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
          <path d="M10 10.5v6" />
          <path d="M14 10.5v6" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.5v5" />
          <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...common}>
          <path d="M20 12.5 11.5 21 3 12.5V4h8.5L20 12.5Z" />
          <circle cx="8" cy="8" r="1.1" />
        </svg>
      )
    default:
      return null
  }
}
