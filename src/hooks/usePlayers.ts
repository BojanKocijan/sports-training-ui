import { useCallback, useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'

export const JERSEY_COLORS = [
  'orange',
  'blue',
  'red',
  'green',
  'purple',
  'black',
  'white',
  'yellow',
] as const

export type JerseyColor = (typeof JERSEY_COLORS)[number]

export interface Player {
  id: string
  group_id: string
  nickname: string
  jersey_number: number | null
  jersey_color: JerseyColor | null
  created_at: string
  updated_at: string
  /** Whether a parent code is currently issued — never the code itself (see
   * sports-training-api#20; GET /players never echoes the raw code back). */
  hasParentCode: boolean
}

/** A group's roster — kids are tracked only by a self-chosen nickname (see the GDPR note in
 * supabase/schema.sql), synced through sports-training-api so every trainer sees the same list. */
export function usePlayers(groupId: string) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.get<Player[]>(`/players?groupId=${encodeURIComponent(groupId)}`)
      setError(null)
      setPlayers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createPlayer(
    passcode: string,
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
  ) {
    await api.post('/players', {
      passcode,
      groupId,
      nickname,
      jerseyNumber,
      jerseyColor,
    })
    await refresh()
  }

  async function updatePlayer(
    passcode: string,
    id: string,
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
  ) {
    await api.put(`/players/${id}`, {
      passcode,
      groupId,
      nickname,
      jerseyNumber,
      jerseyColor,
    })
    await refresh()
  }

  async function deletePlayer(passcode: string, id: string) {
    await api.delete(`/players/${id}`, { passcode })
    await refresh()
  }

  return { players, loading, error, refresh, createPlayer, updatePlayer, deletePlayer }
}

/** Logs one player's rating (1-3, same scale as the exercise-level "Kids liked it?" widget)
 * for a category in a specific training. One row per (player, plan, category) server-side —
 * re-rating the same training+category just overwrites it. */
export async function ratePlayerProgress(
  passcode: string,
  playerId: string,
  planId: string,
  categoryId: string,
  rating: number,
) {
  await api.post(`/players/${playerId}/progress`, { passcode, planId, categoryId, rating })
}

/** Issues a fresh parent code for a player, overwriting any existing one (an old code stops
 * working the moment a new one is generated). Returned only here — a trainer who navigates
 * away without noting it down has to regenerate to see a code again (see
 * sports-training-api#20). */
export async function issueParentCode(passcode: string, playerId: string): Promise<string> {
  const { parentCode } = await api.post<{ parentCode: string }>(`/players/${playerId}/parent-code`, {
    passcode,
  })
  return parentCode
}

/** Revokes a player's parent code — the parent's next LockScreen attempt with the old code
 * fails, same as a trainer whose passcode was reset. */
export async function revokeParentCode(passcode: string, playerId: string) {
  await api.delete(`/players/${playerId}/parent-code`, { passcode })
}
