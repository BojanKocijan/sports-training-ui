import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'
import { DEFAULT_SPORT_ID } from '../data/sports'

export interface Cue {
  nl: string
  en: string
}

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
  }
}

/** Module-level cache shared across every useExercises() call — the exercise library is
 * reference content that doesn't change per-render, so there's no reason for a second mounted
 * component (e.g. the Library tab and the planner wizard open at once) to refetch it. */
let cache: Exercise[] | null = null
let inflight: Promise<Exercise[]> | null = null

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

/** The exercise library (see sports-training-api's GET /exercises), replacing the old
 * hardcoded src/data/exercises.ts — a new exercise, or a whole new sport's content, shows up
 * here as soon as it exists in the database, no app deploy needed. */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache && isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) {
      setExercises(cache)
      setLoading(false)
      return
    }
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false
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
    return () => {
      cancelled = true
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
