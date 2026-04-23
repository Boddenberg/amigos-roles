const USERS: Record<string, string> = {
  filipe: '1801',
  victor: '1902',
  larissa: '0211',
  gustavo: '0308',
  bruno: '2807',
  ricardo: '3004',
}

const STORAGE_KEY = 'itubers_auth'

export type LoggedUser = {
  name: string
  displayName: string
}

export function login(name: string, code: string): LoggedUser | null {
  const key = name.toLowerCase().trim()
  if (USERS[key] && USERS[key] === code.trim()) {
    const user: LoggedUser = {
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  return null
}

export function getCurrentUser(): LoggedUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as LoggedUser
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
}
