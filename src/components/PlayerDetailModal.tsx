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
import { groupSkillCategories, useSkillCategories } from '../hooks/useSkillCategories'
import { formatDate, toLocalIso } from '../utils/format'
import { JerseyGraphic } from './JerseyGraphic'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const SCALE = [
  { value: 1, emoji: '😐' },
  { value: 2, emoji: '🙂' },
  { value: 3, emoji: '🤩' },
] as const

/** A player's detail view — opened by tapping their jersey card on the Players tab. Three tabs:
 * "Stats" (read-only skill profile, at a glance), "This training" (rate a specific plan), and
 * "Details" (bio + parent code). Shows their rating history per skill category (via
 * usePlayerProgress) and lets a trainer log a new rating for any of the group's trainings, not
 * just the one just run in Session — the data is what feeds the group rollup and, eventually,
 * any real analysis of a group's progress over a season. Every rating still needs a plan_id
 * server-side, so "This training" defaults to the nearest training (soonest upcoming, else most
 * recent past) and lets the trainer pick a different one. */
export function PlayerDetailModal({
  player,
  plans,
  passcode,
  onClose,
  onRosterChange,
  onEdit,
  onRemove,
  removing,
}: {
  player: Player
  plans: TrainingPlan[]
  passcode: () => string
  onClose: () => void
  /** Refreshes the roster (see usePlayers) — called after issuing/revoking a parent code so
   * the "has a code" badge here reflects it without a manual reopen. */
  onRosterChange: () => void
  /** Edit/remove now live only here, inside the detail view, instead of on every roster card —
   * one tap on a jersey shouldn't put a delete button in reach by accident. */
  onEdit: () => void
  onRemove: () => void
  removing: boolean
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

  // /skill-categories is a new endpoint (sports-training-api#35) — until that PR merges and
  // deploys, it 404s and skillCategories stays empty. Fall back to the older /categories
  // taxonomy (same 6 top-level ids, just without sub-skill grouping) so rating still works
  // today; this automatically upgrades to the richer grouping once the new endpoint is live.
  const { skillCategories } = useSkillCategories()
  const { categories } = useCategories()
  const groupedSkills =
    skillCategories.length > 0
      ? groupSkillCategories(skillCategories)
      : categories
          .filter((c) => c.id !== 'warmup')
          .map((c) => ({ parent: { id: c.id, label: c.label, emoji: c.emoji }, children: [] as never[] }))

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

  function SkillBar({ id, label, emoji }: { id: string; label: string; emoji: string }) {
    const stat = statFor(id)
    const pct = stat ? (stat.average / 3) * 100 : 0
    return (
      <div className="flex items-center gap-2">
        <span className="w-32 shrink-0 truncate text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {emoji} {label}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-medium text-neutral-400">
          {stat ? stat.average.toFixed(1) : '—'}
        </span>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-40 flex flex-col bg-neutral-50 duration-200 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{player.nickname}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-neutral-400">
          Close
        </Button>
      </header>

      <main className="animate-in zoom-in-95 slide-in-from-bottom-4 mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto px-4 py-4 duration-300 md:max-w-lg">
        <div className="flex flex-col items-center gap-2">
          <JerseyGraphic color={player.jersey_color} number={player.jersey_number} nickname={player.nickname} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" disabled={removing} onClick={onRemove}>
              {removing ? '…' : 'Remove'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="w-full">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="training">This training</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-2">
            {loading && <p className="text-sm text-neutral-400">Loading progress…</p>}
            {error && <p className="text-sm text-red-600">Could not load progress: {error}</p>}
            {groupedSkills.length === 0 && !loading && (
              <p className="text-sm text-neutral-400">No skill categories set up for this sport yet.</p>
            )}
            {groupedSkills.map(({ parent, children }) => (
              <Card key={parent.id} size="sm" className="gap-2 px-3">
                <SkillBar id={parent.id} label={parent.label} emoji={parent.emoji} />
                {children.length > 0 && (
                  <div className="space-y-1.5 border-t border-black/5 pt-2 dark:border-white/5">
                    {children.map((child) => (
                      <SkillBar key={child.id} id={child.id} label={child.label} emoji={child.emoji} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="training" className="space-y-3">
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

                <div className="space-y-2">
                  {groupedSkills.map(({ parent, children }) => (
                    <Card key={parent.id} size="sm" className="gap-2 px-3">
                      {[parent, ...children].map((cat, i) => {
                        const stat = statFor(cat.id)
                        const saved = justSaved[cat.id]
                        return (
                          <div
                            key={cat.id}
                            className={i > 0 ? 'border-t border-black/5 pt-2 dark:border-white/5' : ''}
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
                            <div className="mt-1 flex items-center gap-1">
                              {SCALE.map((s) => (
                                <Button
                                  key={s.value}
                                  variant="ghost"
                                  size="icon-sm"
                                  shape="pill"
                                  disabled={pending[cat.id]}
                                  onClick={() => rate(cat.id, s.value)}
                                  aria-label={`Rate ${cat.label} ${s.value} of 3 for this training`}
                                  className={`text-lg ${
                                    saved === s.value ? 'bg-orange-100 dark:bg-orange-500/20' : ''
                                  }`}
                                >
                                  {s.emoji}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            <Card size="sm" className="gap-2 px-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Bio</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Height
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {player.height_cm !== null ? `${player.height_cm} cm` : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Weight
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {player.weight_kg !== null ? `${player.weight_kg} kg` : '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap Edit above to set or update these.
              </p>
            </Card>

            <Card size="sm" className="gap-1 px-3">
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
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm" disabled={parentCodePending} onClick={handleIssueCode}>
                  {parentCodePending ? '…' : parentCode ? 'Regenerate code' : 'Generate code'}
                </Button>
                {parentCode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={parentCodePending}
                    onClick={handleRevokeCode}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
