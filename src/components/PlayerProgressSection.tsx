import { useState } from 'react'
import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { ratePlayerProgress, usePlayers } from '../hooks/usePlayers'
import { Card } from './ui/card'

const SCALE = [
  { value: 1, emoji: '😐' },
  { value: 2, emoji: '🙂' },
  { value: 3, emoji: '🤩' },
] as const

/** Per-player, per-category quick-tap progress rating for one training — the roster-scoped
 * counterpart to the exercise-level "Kids liked it?" widget. Only meaningful once a training is
 * actually saved as a plan (rate_player ties every rating to a plan_id), so this only renders
 * when `planId` is a real, persisted plan. */
export function PlayerProgressSection({
  groupId,
  planId,
  categories,
}: {
  groupId: string
  planId: string
  categories: CategoryId[]
}) {
  const { players, loading, error } = usePlayers(groupId)
  const { categories: allCategories } = useCategories()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  async function rate(playerId: string, categoryId: CategoryId, value: number) {
    const key = `${playerId}:${categoryId}`
    setPending((p) => ({ ...p, [key]: true }))
    setFailed((f) => ({ ...f, [key]: false }))
    try {
      await ratePlayerProgress(playerId, planId, categoryId, value)
      setRatings((r) => ({ ...r, [key]: value }))
    } catch {
      setFailed((f) => ({ ...f, [key]: true }))
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  if (loading || players.length === 0 || categories.length === 0) return null

  return (
    <section className="px-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Rate the players
      </h2>
      {error && <p className="mb-2 text-sm text-red-600">Could not load players: {error}</p>}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {players.map((p) => (
          <Card key={p.id} className="rounded-2xl p-3">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{p.nickname}</p>
            <div className="mt-2 space-y-1.5">
              {categories.map((categoryId) => {
                const cat = categoryInfo(allCategories, categoryId)
                const key = `${p.id}:${categoryId}`
                const value = ratings[key]
                return (
                  <div key={categoryId} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {cat.emoji} {cat.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {SCALE.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={pending[key]}
                          onClick={() => rate(p.id, categoryId, s.value)}
                          className={`rounded-full p-1 text-base leading-none transition-transform active:scale-90 disabled:opacity-50 ${
                            value === s.value ? 'bg-orange-100 dark:bg-orange-500/20' : ''
                          }`}
                        >
                          {s.emoji}
                        </button>
                      ))}
                      {failed[key] && <span className="text-[10px] text-red-500">!</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
