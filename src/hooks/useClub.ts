import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'

export interface Club {
  name: string
  /** Path under `public/`, relative to the app's base URL (no leading slash) — see ClubHeader. */
  logoUrl: string | null
  tier: 'free' | null
  /** FREE player capacity for this workspace (server default 15). */
  playerLimit: number
}

/**
 * Only one club exists today (Basketball App), so this just reads the first row from the
 * `clubs` table via sports-training-api. Once the app serves multiple clubs, this becomes
 * "resolve the active club by slug/subdomain" instead — the DB shape already supports that.
 *
 * No sport here — a club can run several sport sections (see the `groups`/`group_templates`
 * tables via useGroups), so sport is a property of the active group, not the club.
 */
const FALLBACK_CLUB: Club = { name: 'Basketball App', logoUrl: null, tier: null, playerLimit: 15 }

interface ClubRecord {
  name: string
  logo_url: string | null
  tier: 'free' | null
  player_limit?: number
}

export function useClub() {
  const [club, setClub] = useState<Club>(FALLBACK_CLUB)

  useEffect(() => {
    if (!isApiConfigured) return
    let cancelled = false
    api
      .get<ClubRecord[]>('/clubs')
      .then((data) => {
        const first = data[0]
        if (cancelled || !first) return
        setClub({ name: first.name, logoUrl: first.logo_url, tier: first.tier, playerLimit: first.player_limit ?? 15 })
      })
      .catch(() => {
        // keep the fallback club on error
      })
    return () => {
      cancelled = true
    }
  }, [])

  return club
}
