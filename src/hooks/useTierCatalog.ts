import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import type { TierPackage } from '../components/TierPackagesGrid'

/** The full tier catalog (see sports-training-api's GET /tiers) — pricing, season/monthly
 * rates, status (available/planned) and each tier's feature list, which is where sharing/
 * inviting/org-admin capabilities show up (e.g. "Owner + limited co-coaches", "Trainer
 * management", "Federation admins"). Public endpoint, same data the Packages dialog uses. */
export function useTierCatalog() {
  const [tiers, setTiers] = useState<TierPackage[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<TierPackage[]>('/tiers')
      setTiers(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the tier catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { tiers, loading, error, refresh }
}
