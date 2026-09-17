import { useCallback, useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'

/** The global animal roster a player's mascot_id picks from (sports-training-api#43/#44) —
 * same identity across sports, only the (not-yet-seeded) artwork varies by sport/stage. */
export interface Mascot {
  id: string
  name: string
  sort_order: number
}

/** Fetches the mascot roster once. Currently just seeds 'lion', so there's nothing to pick
 * from yet — this exists so a future avatar picker doesn't need its own fetch plumbing. */
export function useMascots() {
  const [mascots, setMascots] = useState<Mascot[]>([])
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.get<Mascot[]>('/mascots')
      setError(null)
      setMascots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mascots')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { mascots, loading, error, refresh }
}
