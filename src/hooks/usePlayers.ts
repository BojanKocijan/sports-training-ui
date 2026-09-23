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

// Must match the 3 eye-color masks actually produced in Figma for the dynamic 'baby'-stage
// art (sports-training-api#57/#59) -- see JerseyGraphic.tsx's own EYE_COLORS.
export const EYE_COLORS = ['blue', 'green', 'brown'] as const
export type EyeColor = (typeof EYE_COLORS)[number]

// Matches the 2 base poses actually produced (leon-baby-boy.webp / leon-baby-girl.webp), not a
// general gender-identity field -- see JerseyGraphic.tsx's own DEFAULT_GENDER.
export const GENDERS = ['boy', 'girl'] as const
export type Gender = (typeof GENDERS)[number]

/** The only entry in the `mascots` roster today (sports-training-api#43/#44) — every player
 * gets it until more animals ship. Jersey art still resolves by jersey_color, not mascot_id;
 * see JerseyGraphic.tsx. mascot_avatars has no seeded artwork yet, so this is data plumbing
 * only, not a rendering change. */
export const DEFAULT_MASCOT_ID = 'lion'

export interface Player {
  id: string
  group_id: string
  nickname: string
  jersey_number: number | null
  jersey_color: JerseyColor | null
  eye_color: EyeColor | null
  gender: Gender | null
  /** Optional bio details a trainer can fill in — nullable, metric (cm/kg). */
  height_cm: number | null
  weight_kg: number | null
  mascot_id: string | null
  created_at: string
  updated_at: string
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
      const data = await api.get<Player[]>(
        `/players?groupId=${encodeURIComponent(groupId)}`,
      )
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
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null = null,
    weightKg: number | null = null,
    mascotId: string | null = DEFAULT_MASCOT_ID,
    eyeColor: EyeColor | null = null,
    gender: Gender | null = null,
  ) {
    await api.post('/players', {
      groupId,
      nickname,
      jerseyNumber,
      jerseyColor,
      heightCm,
      weightKg,
      mascotId,
      eyeColor,
      gender,
    })
    await refresh()
  }

  async function updatePlayer(
    id: string,
    targetGroupId: string,
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null = null,
    weightKg: number | null = null,
    mascotId: string | null = DEFAULT_MASCOT_ID,
    eyeColor: EyeColor | null = null,
    gender: Gender | null = null,
  ) {
    // update_player defaults mascot_id/eye_color/gender to null when omitted, so these must
    // always be sent — otherwise every edit would silently clear them.
    await api.put(`/players/${id}`, {
      groupId: targetGroupId,
      nickname,
      jerseyNumber,
      jerseyColor,
      heightCm,
      weightKg,
      mascotId,
      eyeColor,
      gender,
    })

    await refresh()
  }

  async function deletePlayer(id: string) {
    await api.delete(`/players/${id}`)
    await refresh()
  }

  return {
    players,
    loading,
    error,
    refresh,
    createPlayer,
    updatePlayer,
    deletePlayer,
  }
}

/** Logs one player's rating (1-3, same scale as the exercise-level "Kids liked it?" widget)
 * for a category in a specific training. One row per (player, plan, category) server-side —
 * re-rating the same training+category just overwrites it. */
export async function ratePlayerProgress(
  playerId: string,
  planId: string,
  categoryId: string,
  rating: number,
) {
  await api.post(`/players/${playerId}/progress`, {
    planId,
    categoryId,
    rating,
  })
}

export interface ParentLink {
  id: string
  email: string
  /** Null until the parent has confirmed the invite and signed in once. */
  confirmed_at: string | null
  created_at: string
}

/** Parent emails linked to a player (trainer-only) with whether each has confirmed yet. */
export async function fetchParentLinks(playerId: string): Promise<ParentLink[]> {
  return api.get<ParentLink[]>(`/players/${playerId}/parents`)
}

/** Links a parent's email to a player and sends them the confirmation invite. */
export async function addParentLink(playerId: string, email: string): Promise<ParentLink | null> {
  const { link } = await api.post<{ link: ParentLink | null; invited: boolean }>(
    `/players/${playerId}/parents`,
    { email },
  )
  return link
}

/** Unlinks a parent's email from a player; they lose access on their next request. */
export async function removeParentLink(playerId: string, linkId: string) {
  await api.delete(`/players/${playerId}/parents/${linkId}`)
}
