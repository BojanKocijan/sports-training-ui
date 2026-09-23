import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'
import { toLocalIso } from '../utils/format'

export interface TrainingPlan {
  id: string
  group_id: string
  training_date: string // YYYY-MM-DD
  title: string
  emoji: string
  exercise_ids: string[]
  created_at: string
  updated_at: string
}

interface PlansSnapshot {
  plans: TrainingPlan[]
  loading: boolean
  error: string | null
  updatedAt: number
}

interface PlansCacheEntry {
  snapshot: PlansSnapshot
  inflight: Promise<TrainingPlan[]> | null
  listeners: Set<() => void>
}

const CACHE_TTL_MS = 60_000

const cacheByGroup = new Map<string, PlansCacheEntry>()

function getCacheEntry(groupId: string): PlansCacheEntry {
  let entry = cacheByGroup.get(groupId)

  if (!entry) {
    entry = {
      snapshot: {
        plans: [],
        loading: isApiConfigured,
        error: null,
        updatedAt: 0,
      },
      inflight: null,
      listeners: new Set(),
    }

    cacheByGroup.set(groupId, entry)
  }

  return entry
}

function emit(entry: PlansCacheEntry) {
  entry.listeners.forEach((listener) => listener())
}

function isCacheFresh(entry: PlansCacheEntry) {
  return (
    entry.snapshot.updatedAt > 0 &&
    Date.now() - entry.snapshot.updatedAt < CACHE_TTL_MS
  )
}

async function fetchPlans(
  groupId: string,
  force = false,
): Promise<TrainingPlan[]> {
  const entry = getCacheEntry(groupId)

  if (!force && isCacheFresh(entry)) {
    return entry.snapshot.plans
  }

  if (entry.inflight) {
    const pending = entry.inflight

    if (!force) {
      return pending
    }

    try {
      await pending
    } catch {
      // A forced refresh still needs fresh server state even if the older request failed.
    }

    // Another forced caller may already have started the fresh request while we were waiting.
    if (entry.inflight) {
      return entry.inflight
    }
  }

  if (entry.snapshot.updatedAt === 0) {
    entry.snapshot = {
      ...entry.snapshot,
      loading: true,
      error: null,
    }

    emit(entry)
  }

  entry.inflight = api
    .get<TrainingPlan[]>(`/plans?groupId=${encodeURIComponent(groupId)}`)
    .then((plans) => {
      entry.snapshot = {
        plans,
        loading: false,
        error: null,
        updatedAt: Date.now(),
      }

      emit(entry)

      return plans
    })
    .catch((error) => {
      const hasCachedData = entry.snapshot.updatedAt > 0

      entry.snapshot = {
        ...entry.snapshot,
        loading: false,
        error: hasCachedData
          ? null
          : error instanceof Error
            ? error.message
            : 'Failed to load plans',
      }

      emit(entry)

      throw error
    })
    .finally(() => {
      entry.inflight = null
    })

  return entry.inflight
}

function subscribeToPlans(groupId: string, listener: () => void) {
  const entry = getCacheEntry(groupId)

  entry.listeners.add(listener)

  return () => {
    entry.listeners.delete(listener)
  }
}

function getPlansSnapshot(groupId: string) {
  return getCacheEntry(groupId).snapshot
}

/** Shared, dated training plans for one group — synced through sports-training-api so every trainer
 * sees the same calendar.
 *
 * Plans are cached per group, concurrent requests are deduplicated, and every mounted usePlans()
 * instance for the same group shares updates. This avoids duplicate requests from multiple screens
 * and React StrictMode while keeping create/update/delete immediately synchronized everywhere.
 */
export function usePlans(groupId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToPlans(groupId, listener),
    [groupId],
  )

  const getSnapshot = useCallback(() => getPlansSnapshot(groupId), [groupId])

  const { plans, loading, error } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  )

  useEffect(() => {
    if (!isApiConfigured) return

    void fetchPlans(groupId).catch(() => {
      // Error state is stored in the shared snapshot.
    })

    const intervalId = window.setInterval(() => {
      void fetchPlans(groupId).catch(() => {
        // Keep cached plans usable if a background refresh fails.
      })
    }, CACHE_TTL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [groupId])

  const refresh = useCallback(async () => {
    if (!isApiConfigured) return

    await fetchPlans(groupId, true)
  }, [groupId])

  const today = toLocalIso(new Date())
  const upcoming = plans.filter((plan) => plan.training_date >= today)
  const past = plans.filter((plan) => plan.training_date < today)
  const nextPlan: TrainingPlan | null = upcoming.length > 0 ? upcoming[0] : null

  async function createPlan(
    trainingDate: string,
    title: string,
    emoji: string,
    exerciseIds: string[],
  ) {
    await api.post('/plans', {
      groupId,
      trainingDate,
      title,
      emoji,
      exerciseIds,
    })

    await refresh()
  }

  async function updatePlan(
    id: string,
    trainingDate: string,
    title: string,
    emoji: string,
    exerciseIds: string[],
  ) {
    await api.put(`/plans/${id}`, {
      trainingDate,
      title,
      emoji,
      exerciseIds,
    })

    await refresh()
  }

  async function deletePlan(id: string) {
    await api.delete(`/plans/${id}`)

    await refresh()
  }

  return {
    plans,
    upcoming,
    past,
    nextPlan,
    loading,
    error,
    refresh,
    createPlan,
    updatePlan,
    deletePlan,
  }
}
