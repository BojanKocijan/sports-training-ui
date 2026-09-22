export interface AccountSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: { id: string; email: string; superadmin: boolean }
  groupIds: string[]
  memberships: { club_id: string; group_id: string | null; role: string; active: boolean }[]
}

const STORAGE_KEY = 'sports-training-account-session'
let session: AccountSession | null = null
let refreshInFlight: Promise<AccountSession | null> | null = null

function readStored(): AccountSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AccountSession
    return parsed.accessToken && parsed.refreshToken ? parsed : null
  } catch {
    return null
  }
}

export function currentSession(): AccountSession | null {
  return session ?? (session = readStored())
}

export function saveSession(next: AccountSession | null) {
  session = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing can disable persistent storage; this tab still works in memory.
  }
  window.dispatchEvent(new Event('trainer-session-changed'))
}

export async function validSession(apiUrl: string): Promise<AccountSession | null> {
  const current = currentSession()
  if (!current) return null
  if (current.expiresAt > Date.now() / 1000 + 60) return current
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
      if (!res.ok) throw new Error('Session refresh failed')
      const renewed = await res.json() as AccountSession
      saveSession(renewed)
      return renewed
    } catch {
      saveSession(null)
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function signOut(apiUrl: string) {
  const current = currentSession()
  if (current) {
    try {
      await fetch(`${apiUrl}/auth/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${current.accessToken}` },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
    } catch {
      // The browser can still end its local session if the API is temporarily unreachable.
    } finally {
      saveSession(null)
    }
  }
}
