import { useCallback, useEffect, useState } from 'react'
import { fullU8Session } from '../data/plans'
import { findExercise, useExercises } from './useExercises'

const STORAGE_KEY = 'u8-active-plan'

interface StoredPlan {
  title: string
  emoji: string
  exerciseIds: string[]
}

function loadPlan(): StoredPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPlan
      if (Array.isArray(parsed.exerciseIds) && parsed.exerciseIds.length > 0) return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return { title: fullU8Session.title, emoji: fullU8Session.emoji, exerciseIds: fullU8Session.exerciseIds }
}

/** The exercise line-up the coach is currently running or about to run in the Session tab. */
export function useActivePlan() {
  const { exercises } = useExercises()
  const [plan, setPlan] = useState<StoredPlan>(loadPlan)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
    } catch {
      // storage unavailable; ignore
    }
  }, [plan])

  const setActivePlan = useCallback((title: string, emoji: string, exerciseIds: string[]) => {
    setPlan({ title, emoji, exerciseIds })
  }, [])

  const planExercises = plan.exerciseIds
    .map((id) => findExercise(exercises, id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
  const totalMinutes = planExercises.reduce((sum, e) => sum + e.durationMinutes, 0)

  return {
    planTitle: plan.title,
    planEmoji: plan.emoji,
    planExercises,
    totalMinutes,
    setActivePlan,
    resetToFullSession: () =>
      setActivePlan(fullU8Session.title, fullU8Session.emoji, fullU8Session.exerciseIds),
  }
}
