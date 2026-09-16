import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'
import { DEFAULT_SPORT_ID } from '../data/sports'

export type SkillCategoryId = string

export interface SkillCategory {
  id: SkillCategoryId
  label: string
  emoji: string
  /** null for a top-level category (e.g. 'dribbling'); set for a finer sub-skill (e.g.
   * 'dribbling_strong_hand') that should group under its parent in the UI. */
  parentId: SkillCategoryId | null
}

interface ApiSkillCategory {
  id: string
  label: string
  emoji: string
  parent_id: string | null
}

/** Module-level cache shared across every useSkillCategories() call — same reasoning as
 * useCategories: small, shared reference content, not per-component state. */
let cache: SkillCategory[] | null = null
let inflight: Promise<SkillCategory[]> | null = null

async function fetchSkillCategories(): Promise<SkillCategory[]> {
  if (cache) return cache
  if (!inflight) {
    inflight = api
      .get<ApiSkillCategory[]>(`/skill-categories?sportId=${DEFAULT_SPORT_ID}`)
      .then((data) => {
        cache = data.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, parentId: c.parent_id }))
        return cache
      })
      .catch((e) => {
        inflight = null
        throw e
      })
  }
  return inflight
}

/** The taxonomy a player's progress is rated against (see sports-training-api's
 * GET /skill-categories) — separate from useCategories' exercise-content taxonomy, since the
 * two overlap but serve different features (see that endpoint's own comment). */
export function useSkillCategories() {
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache && isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) {
      setSkillCategories(cache)
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
    fetchSkillCategories()
      .then((data) => {
        if (!cancelled) setSkillCategories(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load skill categories')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { skillCategories, loading, error }
}

/** Top-level categories (parentId === null), each with its own sub-skills (if any) attached —
 * what PlayerDetailModal actually renders: a parent row, then its children indented under it. */
export function groupSkillCategories(categories: SkillCategory[]) {
  const topLevel = categories.filter((c) => c.parentId === null)
  return topLevel.map((parent) => ({
    parent,
    children: categories.filter((c) => c.parentId === parent.id),
  }))
}
