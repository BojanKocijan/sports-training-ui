import { useCallback, useEffect, useState } from 'react'
import { api, ApiRequestError, isApiConfigured } from '../lib/apiClient'

export type MilestoneType = 'badge' | 'diploma' | 'promotion'
export type MilestoneState = 'awarded' | 'eligible' | 'locked'

export interface ProgressionMilestone {
  id: string
  sport_id: string
  group_template_id: string
  type: MilestoneType
  threshold_points: number
  name: string
  emoji: string
  sort_order: number
  target_group_template_id: string | null
  skillCategoryIds: string[]
  points: number
  state: MilestoneState
  awardedAt: string | null
}

export interface PlayerProgression {
  sportId: string
  points: number
  milestones: ProgressionMilestone[]
}

/** A player's whole path through the milestone system: points rolled up from skill ratings, and
 * the ordered badges/diplomas/promotion flags they unlock along the way (sports-training-api#115,
 * GET /players/:id/progression). Milestones already come back in `sort_order` covering all three
 * states, so this is a thin fetch + award wrapper, not an aggregator like usePlayerProgress.
 * `award` is a no-op the caller should simply not wire up for the read-only parent view — the API
 * itself 403s a parent's award attempt, this just keeps the button out of that view entirely. */
export function usePlayerProgression(playerId: string) {
  const [progression, setProgression] = useState<PlayerProgression | null>(null)
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState<string | null>(null)
  const [awardingId, setAwardingId] = useState<string | null>(null)
  const [awardError, setAwardError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.get<PlayerProgression>(`/players/${encodeURIComponent(playerId)}/progression`)
      setError(null)
      setProgression(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progression')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const award = useCallback(
    async (milestoneId: string) => {
      setAwardingId(milestoneId)
      setAwardError(null)
      try {
        await api.post(`/players/${encodeURIComponent(playerId)}/milestones/${encodeURIComponent(milestoneId)}/award`, {})
        await refresh()
      } catch (err) {
        setAwardError(
          err instanceof ApiRequestError && err.status === 409
            ? 'Not eligible yet, or already awarded.'
            : err instanceof Error
              ? err.message
              : 'Could not award this milestone',
        )
      } finally {
        setAwardingId(null)
      }
    },
    [playerId, refresh],
  )

  return { progression, loading, error, refresh, award, awardingId, awardError }
}
