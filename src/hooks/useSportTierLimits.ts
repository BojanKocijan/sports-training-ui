import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

export interface SportTierLimit {
  sportId: string
  tier: string
  /** Default total roster seat count for this sport/tier — not per group. A club's own
   * player_limit override (see WorkspacePlanEditor) takes precedence over this default. */
  maxPlayers: number
  updatedAt: string
}

export function useSportTierLimits() {
  const [limits, setLimits] = useState<SportTierLimit[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<{ limits: SportTierLimit[] }>('/admin/sport-tier-limits')
      setLimits(data.limits)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load sport pricing limits')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { limits, loading, error, refresh }
}
