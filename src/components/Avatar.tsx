type AvatarProps = {
  name: string
  photoUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

// Variante de cor determinística a partir do nome (dá charme ao avatar).
function variantFor(name: string) {
  const key = (name || '?').trim().toLowerCase()
  let sum = 0
  for (let i = 0; i < key.length; i++) sum = (sum + key.charCodeAt(i)) % 6
  return `v${sum + 1}`
}

export function Avatar({ name, photoUrl, size = 'md' }: AvatarProps) {
  const variant = photoUrl ? '' : ` avatar--${variantFor(name)}`
  return (
    <span className={`avatar avatar--${size}${variant}`} aria-hidden="true">
      {photoUrl ? <img src={photoUrl} alt="" /> : <span>{getInitials(name)}</span>}
    </span>
  )
}

type AvatarGroupProps = {
  people: Array<{ name: string; photoUrl?: string }>
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarGroup({ people, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = people.slice(0, max)
  const rest = people.length - visible.length

  return (
    <span className="avatar-group">
      {visible.map((person) => (
        <Avatar
          key={person.name}
          name={person.name}
          photoUrl={person.photoUrl}
          size={size}
        />
      ))}
      {rest > 0 ? (
        <span className="avatar-group__more" aria-hidden="true">
          +{rest}
        </span>
      ) : null}
    </span>
  )
}
