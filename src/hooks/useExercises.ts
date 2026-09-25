import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'
import { DEFAULT_SPORT_ID } from '../data/sports'

export interface Cue {
  nl: string
  en: string
}

export interface ExerciseGuidance {
  groupTemplateId: string
  note: string
}

export type ShareStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type IconKind = 'library' | 'emoji'

export interface Exercise {
  id: string
  emoji: string
  title: string
  subtitle?: string
  categories: string[]
  durationMinutes: number
  goal: string
  steps: string[]
  cues?: Cue[]
  isBreak?: boolean
  groups?: string[]
  guidance?: ExerciseGuidance[]
  /** A trainer's own exercise (sports-training-api#98), never true on a seeded library row. */
  isCustom?: boolean
  ownerAccountId?: string | null
  clubId?: string | null
  shareStatus?: ShareStatus
  shareRejectedReason?: string | null
  iconKind?: IconKind
  iconValue?: string | null
  /** Only present on the owner/club_admin's own GET /exercises/:id read. */
  usedByOtherTrainers?: number
}

interface ApiExercise {
  id: string
  title: string
  emoji: string
  subtitle: string | null
  duration_minutes: number
  goal: string
  steps: string[]
  cues: Cue[] | null
  is_break: boolean
  categories: string[]
  groups: string[] | null
  guidance?: Array<{ group_template_id: string; note: string }>
  is_custom?: boolean
  owner_account_id?: string | null
  club_id?: string | null
  share_status?: ShareStatus
  share_rejected_reason?: string | null
  icon_kind?: IconKind
  icon_value?: string | null
  usedByOtherTrainers?: number
}

function mapExercise(e: ApiExercise): Exercise {
  return {
    id: e.id,
    emoji: e.emoji,
    title: e.title,
    subtitle: e.subtitle ?? undefined,
    categories: e.categories,
    durationMinutes: e.duration_minutes,
    goal: e.goal,
    steps: e.steps,
    cues: e.cues ?? undefined,
    isBreak: e.is_break || undefined,
    groups: e.groups ?? undefined,
    guidance: (e.guidance ?? []).map((item) => ({
      groupTemplateId: item.group_template_id,
      note: item.note,
    })),
    isCustom: e.is_custom ?? false,
    ownerAccountId: e.owner_account_id ?? null,
    clubId: e.club_id ?? null,
    shareStatus: e.share_status ?? 'none',
    shareRejectedReason: e.share_rejected_reason ?? null,
    iconKind: e.icon_kind ?? 'emoji',
    iconValue: e.icon_value ?? null,
    usedByOtherTrainers: e.usedByOtherTrainers,
  }
}

/** Module-level cache shared across every useExercises() call — the exercise library is mostly
 * reference content that doesn't change per-render, so there's no reason for a second mounted
 * component (e.g. the Library tab and the planner wizard open at once) to refetch it. Since the
 * response also carries the signed-in account's own custom exercises, every mounted hook
 * refetches on sign-in/out and whenever a custom-exercise mutation happens (see
 * invalidateExercises), instead of only ever fetching once per page load. */
let cache: Exercise[] | null = null
let inflight: Promise<Exercise[]> | null = null
const listeners = new Set<() => void>()

async function fetchExercises(): Promise<Exercise[]> {
  if (cache) return cache
  if (!inflight) {
    inflight = api
      .get<ApiExercise[]>(`/exercises?sportId=${DEFAULT_SPORT_ID}`)
      .then((data) => {
        cache = data.map(mapExercise)
        return cache
      })
      .catch((e) => {
        inflight = null
        throw e
      })
  }
  return inflight
}

/** Call after creating/editing/deleting/sharing a custom exercise so every mounted
 * useExercises() re-fetches instead of showing stale data until the next full reload. */
export function invalidateExercises() {
  cache = null
  inflight = null
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('trainer-session-changed', invalidateExercises)
}

/** The exercise library (see sports-training-api's GET /exercises), replacing the old
 * hardcoded src/data/exercises.ts — a new exercise, or a whole new sport's content, shows up
 * here as soon as it exists in the database, no app deploy needed. Signed in, it also carries
 * the caller's own custom exercises and any club shares currently visible to them. */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache && isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      if (cache) {
        setExercises(cache)
        setLoading(false)
        return
      }
      if (!isApiConfigured) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      fetchExercises()
        .then((data) => {
          if (!cancelled) setExercises(data)
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load exercises')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    load()
    listeners.add(load)
    return () => {
      cancelled = true
      listeners.delete(load)
    }
  }, [])

  return { exercises, loading, error }
}

export function findExercise(exercises: Exercise[], id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id)
}

/** Exercises appropriate for a given group template (see group_templates, e.g. 'u8'/'u10') —
 * untagged exercises are shared fundamentals and show for every group. */
export function exercisesForGroup(exercises: Exercise[], templateId: string): Exercise[] {
  return exercises.filter((e) => !e.groups || e.groups.includes(templateId))
}

/** The hand-authored note for this exercise and stable age-band template, if one exists. */
export function guidanceForGroup(
  exercise: Exercise,
  groupTemplateId: string,
): string | undefined {
  return exercise.guidance?.find((item) => item.groupTemplateId === groupTemplateId)?.note
}

export interface ExerciseIcon {
  kind: IconKind
  value: string
}

export interface CustomExerciseInput {
  title: string
  goal: string
  steps: string[]
  categories: string[]
  durationMinutes: number
  icon: ExerciseIcon
}

/** Create/edit/delete/share a trainer's own custom exercise (sports-training-api#98) — never
 * gated by tier for create/edit/delete; sharing is always requestable, approval is what the
 * CLUB-tier gate applies to. Every mutation invalidates the shared cache so open Library/planner
 * views pick up the change immediately. */
export function useCustomExercises() {
  async function createExercise(clubId: string, input: CustomExerciseInput): Promise<Exercise> {
    const created = await api.post<ApiExercise>('/exercises', {
      clubId, sportId: DEFAULT_SPORT_ID, ...input,
    })
    invalidateExercises()
    return mapExercise(created)
  }

  async function updateExercise(id: string, input: CustomExerciseInput): Promise<Exercise> {
    const updated = await api.put<ApiExercise>(`/exercises/${id}`, input)
    invalidateExercises()
    return mapExercise(updated)
  }

  async function deleteExercise(id: string): Promise<void> {
    await api.delete(`/exercises/${id}`)
    invalidateExercises()
  }

  async function requestShare(id: string): Promise<Exercise> {
    const updated = await api.post<ApiExercise>(`/exercises/${id}/share`, {})
    invalidateExercises()
    return mapExercise(updated)
  }

  async function approveShare(id: string): Promise<Exercise> {
    const updated = await api.post<ApiExercise>(`/exercises/${id}/share/approve`, {})
    invalidateExercises()
    return mapExercise(updated)
  }

  async function rejectShare(id: string, reason: string): Promise<Exercise> {
    const updated = await api.post<ApiExercise>(`/exercises/${id}/share/reject`, { reason })
    invalidateExercises()
    return mapExercise(updated)
  }

  async function fetchDetails(id: string): Promise<Exercise> {
    return mapExercise(await api.get<ApiExercise>(`/exercises/${id}`))
  }

  return { createExercise, updateExercise, deleteExercise, requestShare, approveShare, rejectShare, fetchDetails }
}
