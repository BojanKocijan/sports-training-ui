import { useEffect, useState } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'
import { DEFAULT_SPORT_ID } from '../data/sports'

export type CategoryId = string

export interface Category {
  id: CategoryId
  label: string
  emoji: string
}

interface ApiCategory {
  id: string
  label: string
  emoji: string
}

/** Module-level cache shared across every useCategories() call — same reasoning as
 * useExercises: this is small, shared reference content, not per-component state. */
let cache: Category[] | null = null
let inflight: Promise<Category[]> | null = null

async function fetchCategories(): Promise<Category[]> {
  if (cache) return cache
  if (!inflight) {
    inflight = api
      .get<ApiCategory[]>(`/categories?sportId=${DEFAULT_SPORT_ID}`)
      .then((data) => {
        cache = data.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji }))
        return cache
      })
      .catch((e) => {
        inflight = null
        throw e
      })
  }
  return inflight
}

/** Exercise/training categories (see sports-training-api's GET /categories), replacing the
 * old hardcoded src/data/categories.ts. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache && isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) {
      setCategories(cache)
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
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load categories')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, loading, error }
}

export function categoryInfo(categories: Category[], id: CategoryId): Category {
  return categories.find((c) => c.id === id) ?? { id, label: id, emoji: '🏀' }
}
