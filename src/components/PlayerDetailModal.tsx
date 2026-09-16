import { useEffect, useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import {
  fetchParentCode,
  issueParentCode,
  ratePlayerProgress,
  revokeParentCode,
  type Player,
} from '../hooks/usePlayers'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import type { TrainingPlan } from '../hooks/usePlans'
import { formatDate, toLocalIso } from '../utils/format'
import { JerseyGraphic } from './JerseyGraphic'

const SCALE = [
  { value: 1, emoji: '😐' },
  { value: 2, emoji: '🙂' },
  { value: 3, emoji: '🤩' },
] as const

/** A player's detail view — opened by tapping their jersey card on the Players tab. Shows their
 * rating history per skill category (via usePlayerProgress) and lets a trainer log a new rating
 * for any of the group's trainings, not just the one just run in Session — the data is what
 * feeds the group rollup and, eventually, any real analysis of a group's progress over a
 * season. Every rating still needs a plan_id server-side, so this defaults to the nearest
 * training (soonest upcoming, else most recent past) and lets the trainer pick a different one. */
export function PlayerDetailModal({
  player,
  plans,
  passcode,
  onClose,
  onRosterChange,
}: {
  player: Player
  plans: TrainingPlan[]
  passcode: () => string
  onClose: () => void
  /** Refreshes the roster (see usePlayers) — called after issuing/revoking a parent code so
   * the "has a code" badge here reflects it without a manual reopen. */
  onRosterChange: () => void
}) {
  const { byCategory, loading, error, refresh } = usePlayerProgress(player.id)
  const [parentCode, setParentCode] = useState<string | null>(null)
  const [parentCodeLoading, setParentCodeLoading] = useState(true)
  const [parentCodePending, setParentCodePending] = useState(false)
  const [parentCodeError, setParentCodeError] = useState<string | null>(null)

  // Trainer-only — never fetched or shown anywhere in the parent-facing view (see ParentView).
  useEffect(() => {
    let cancelled = false
    setParentCodeLoading(true)
    fetchParentCode(passcode(), player.id)
      .then((code) => {
        if (!cancelled) setParentCode(code)
      })
      .catch((e) => {
        if (!cancelled) setParentCodeError(e instanceof Error ? e.message : 'Could not load the code')
      })
      .finally(() => {
        if (!cancelled) setParentCodeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [passcode, player.id])

  async function handleIssueCode() {
    setParentCodePending(true)
    setParentCodeError(null)
    try {
      const code = await issueParentCode(passcode(), player.id)
      setParentCode(code)
      onRosterChange()
    } catch (e) {
      setParentCodeError(e instanceof Error ? e.message : 'Could not generate a code')
    } finally {
      setParentCodePending(false)
    }
  }

  async function handleRevokeCode() {
    setParentCodePending(true)
    setParentCodeError(null)
    try {
      await revokeParentCode(passcode(), player.id)
      setParentCode(null)
      onRosterChange()
    } catch (e) {
      setParentCodeError(e instanceof Error ? e.message : 'Could not revoke the code')
    } finally {
      setParentCodePending(false)
    }
  }
  const { categories } = useCategories()
  // Same taxonomy as skill_categories in supabase/schema.sql — every training category except
  // warm-up, which isn't a skill to rate progress on.
  const skillCategories = categories.filter((c) => c.id !== 'warmup')

  const sortedPlans = [...plans].sort((a, b) => a.training_date.localeCompare(b.training_date))
  const today = toLocalIso(new Date())
  const defaultPlan = sortedPlans.find((p) => p.training_date >= today) ?? sortedPlans[sortedPlans.length - 1]
  const [planId, setPlanId] = useState<string | null>(defaultPlan?.id ?? null)

  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [rateError, setRateError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState<Record<string, number>>({})

  async function rate(categoryId: string, value: number) {
    if (!planId) return
    setPending((p) => ({ ...p, [categoryId]: true }))
    setRateError(null)
    try {
      await ratePlayerProgress(passcode(), player.id, planId, categoryId, value)
      setJustSaved((s) => ({ ...s, [categoryId]: value }))
      await refresh()
    } catch (e) {
      setRateError(e instanceof Error ? e.message : 'Could not save rating')
    } finally {
      setPending((p) => ({ ...p, [categoryId]: false }))
    }
  }

  function statFor(categoryId: string) {
    return byCategory.find((c) => c.categoryId === categoryId)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{player.nickname}</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-neutral-400">
          Close
        </button>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto px-4 py-4 md:max-w-lg">
        <div className="flex justify-center">
          <JerseyGraphic color={player.jersey_color} number={player.jersey_number} nickname={player.nickname} />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Parent code · visible to trainers only
          </p>
          {parentCodeLoading ? (
            <p className="mt-1 text-sm text-neutral-400">Loading…</p>
          ) : parentCode ? (
            <div className="mt-1.5 rounded-xl bg-orange-50 p-2.5 dark:bg-orange-500/10">
              <p className="font-mono text-lg font-bold tracking-widest text-orange-700 dark:text-orange-300">
                {parentCode}
              </p>
              <p className="mt-0.5 text-xs text-orange-800 dark:text-orange-300">
                Share this with {player.nickname}'s parent — they enter it on the group's lock
                screen, same as a trainer code.
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              No parent code yet — generate one to let this child's parent view their progress.
            </p>
          )}
          {parentCodeError && <p className="mt-1 text-xs font-semibold text-red-600">{parentCodeError}</p>}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              disabled={parentCodePending}
              onClick={handleIssueCode}
              className="text-xs font-bold text-orange-600 disabled:opacity-50"
            >
              {parentCodePending ? '…' : parentCode ? 'Regenerate code' : 'Generate code'}
            </button>
            {parentCode && (
              <button
                type="button"
                disabled={parentCodePending}
                onClick={handleRevokeCode}
                className="text-xs font-semibold text-red-500 disabled:opacity-50"
              >
                Revoke
              </button>
            )}
          </div>
        </div>

        {sortedPlans.length === 0 ? (
          <p className="text-center text-sm text-neutral-400">
            No trainings planned for this group yet — plan one on the Groups tab before rating.
          </p>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Rating for
              </label>
              <select
                value={planId ?? ''}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {sortedPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatDate(p.training_date)}
                  </option>
                ))}
              </select>
            </div>

            {rateError && <p className="text-sm text-red-600">{rateError}</p>}
            {error && <p className="text-sm text-red-600">Could not load progress: {error}</p>}

            <div className="space-y-2">
              {skillCategories.map((cat) => {
                const stat = statFor(cat.id)
                const saved = justSaved[cat.id]
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        {cat.emoji} {cat.label}
                      </span>
                      {stat && (
                        <span className="text-xs font-medium text-neutral-400">
                          avg {stat.average.toFixed(1)} · {stat.count}×
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {SCALE.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={pending[cat.id]}
                          onClick={() => rate(cat.id, s.value)}
                          className={`rounded-full p-1.5 text-lg leading-none transition-transform active:scale-90 disabled:opacity-50 ${
                            saved === s.value ? 'bg-orange-100 dark:bg-orange-500/20' : ''
                          }`}
                        >
                          {s.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {loading && <p className="text-sm text-neutral-400">Loading progress…</p>}
      </main>
    </div>
  )
}
