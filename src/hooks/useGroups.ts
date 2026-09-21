import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'

export interface ApiGroup {
  id: string
  /** The age-band catalog entry this group is an instance of (e.g. 'u8', 'u10') — stable even
   * if an admin renames the group itself. Used to key group-specific content like exercises. */
  templateId: string
  templateLabel: string
  name: string
  emoji: string
  status: 'available' | 'coming_soon'
}

interface RawGroup {
  id: string
  template_id: string
  name: string
  group_templates: {
    label: string
    emoji: string
    status: 'available' | 'coming_soon'
  } | null
}

const CACHE_TTL_MS = 60_000

let cache: ApiGroup[] | null = null
let cacheUpdatedAt = 0
let inflight: Promise<ApiGroup[]> | null = null

function mapGroup(group: RawGroup): ApiGroup {
  return {
    id: group.id,
    templateId: group.template_id,
    templateLabel: group.group_templates?.label ?? group.template_id.toUpperCase(),
    name: group.name,
    emoji: group.group_templates?.emoji ?? '🏀',
    status: group.group_templates?.status ?? 'available',
  }
}

function isCacheFresh() {
  return cache !== null && Date.now() - cacheUpdatedAt < CACHE_TTL_MS
}

async function fetchGroups(): Promise<ApiGroup[]> {
  if (isCacheFresh()) {
    return cache!
  }

  if (inflight) {
    return inflight
  }

  inflight = api
    .get<RawGroup[]>('/groups')
    .then((data) => {
      cache = data.map(mapGroup)
      cacheUpdatedAt = Date.now()
      return cache
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** The club's groups (see sports-training-api's /groups), replacing the old hardcoded
 * src/data/groups.ts list — a new group (e.g. U10, or a future U12) shows up here as soon as
 * it exists in the database, no app deploy needed.
 *
 * Group data is shared across mounted useGroups() instances. Concurrent requests are deduplicated,
 * cached briefly, and refreshed in the background so React StrictMode and multiple screens don't
 * repeatedly request the same catalog.
 */
export function useGroups() {
  const [groups, setGroups] = useState<ApiGroup[]>(() => cache ?? [])
  const [loading, setLoading] = useState(() => !cache && isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured) return

    let cancelled = false

    async function refresh() {
      try {
        const data = await fetchGroups()

        if (!cancelled) {
          setGroups(data)
          setError(null)
        }
      } catch (e) {
        // Keep already-cached groups usable if only a background refresh failed.
        if (!cancelled && !cache) {
          setError(e instanceof Error ? e.message : 'Could not load groups')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    refresh()

    const intervalId = window.setInterval(refresh, CACHE_TTL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return { groups, loading, error }
}
