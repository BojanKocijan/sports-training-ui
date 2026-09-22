import { useEffect, useMemo, useRef } from 'react'
import type { useActivePlan } from '../hooks/useActivePlan'
import type { CategoryId } from '../hooks/useCategories'
import { useFullscreen } from '../hooks/useFullscreen'
import { useRatings } from '../hooks/useRatings'
import { useSessionClock } from '../hooks/useSessionClock'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { notify, requestNotificationPermission } from '../lib/notify'
import { formatClock } from '../utils/format'
import { ExerciseTimeline } from './ExerciseTimeline'
import { PlayerProgressSection } from './PlayerProgressSection'
import { Card } from './ui/card'

export function SessionScreen({
  activePlan,
  planId,
  groupId,
  groupTemplateId,
  groupTemplateLabel,
  trainerAccess,
  onBuildPlan,
}: {
  activePlan: ReturnType<typeof useActivePlan>
  /** The real, saved plan's id (see usePlans) — null when this session is just the default
   * fallback session, not a training actually planned for this group. Player progress ratings
   * are tied to a plan_id server-side, so rating only makes sense once one exists. */
  planId: string | null
  groupId: string
  groupTemplateId: string
  groupTemplateLabel: string
  trainerAccess: ReturnType<typeof useTrainerAccess>
  onBuildPlan: () => void
}) {
  const { planTitle, planEmoji, planExercises, totalMinutes } = activePlan
  const { unlocked } = trainerAccess
  const { elapsedSeconds, running, controlError, start, pause, reset, jumpTo } = useSessionClock(groupId)
  const { rate, stats } = useRatings(groupId)
  const { enter: enterFullscreen, exit: exitFullscreen } = useFullscreen()
  const totalSeconds = totalMinutes * 60

  // Categories this training actually touched — matches skill_categories' taxonomy (same ids
  // minus 'warmup', see supabase/schema.sql), so player ratings only ask about skills relevant
  // to the training just run instead of all six every time.
  const sessionCategories = useMemo(() => {
    const seen = new Set<CategoryId>()
    for (const exercise of planExercises) {
      for (const category of exercise.categories) {
        if (category !== 'warmup') seen.add(category)
      }
    }
    return [...seen]
  }, [planExercises])

  // cumulative start/end (in seconds) for each exercise, derived from the active plan's order —
  // this is the vertical timeline, top to bottom, current/next exercise always first in view
  const timeline = useMemo(() => {
    return planExercises.reduce<{ exercise: (typeof planExercises)[number]; startSec: number; endSec: number }[]>(
      (acc, exercise) => {
        const startSec = acc.length > 0 ? acc[acc.length - 1].endSec : 0
        acc.push({ exercise, startSec, endSec: startSec + exercise.durationMinutes * 60 })
        return acc
      },
      [],
    )
  }, [planExercises])

  const currentIndex = useMemo(() => {
    const idx = timeline.findIndex((t) => elapsedSeconds < t.endSec)
    return idx === -1 ? timeline.length - 1 : idx
  }, [timeline, elapsedSeconds])

  const currentEntry = timeline[currentIndex]
  const isSessionDone = elapsedSeconds >= totalSeconds

  const overallPct = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0

  // Notify when a segment's time naturally runs out (one tick at a time while running) — not on
  // manual prev/next/reset, which jump elapsedSeconds instead of incrementing it by one.
  const lastElapsedRef = useRef(elapsedSeconds)
  useEffect(() => {
    const previousElapsed = lastElapsedRef.current
    lastElapsedRef.current = elapsedSeconds
    if (!running || elapsedSeconds - previousElapsed !== 1) return

    const finishedIndex = timeline.findIndex((t) => t.endSec === elapsedSeconds)
    if (finishedIndex === -1) return

    const finished = timeline[finishedIndex].exercise
    const next = timeline[finishedIndex + 1]?.exercise
    notify(
      next ? `Time's up: ${finished.title}` : 'Session complete! 🏆',
      next ? `Next: ${next.emoji} ${next.title}` : 'Great job, coaches, time for high-fives.',
    )
  }, [elapsedSeconds, running, timeline])

  useEffect(() => {
    if (isSessionDone) exitFullscreen()
  }, [isSessionDone, exitFullscreen])

  function goToIndex(index: number) {
    if (!unlocked) return
    const target = timeline[Math.max(0, Math.min(timeline.length - 1, index))]
    jumpTo(target.startSec)
  }

  if (!currentEntry) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4 md:max-w-xl">
        <p className="text-center text-sm text-neutral-500">No exercises in this training yet.</p>
        <button
          type="button"
          onClick={onBuildPlan}
          className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white"
        >
          Plan a training
        </button>
      </div>
    )
  }

  const { exercise: current } = currentEntry
  const remainingInSegment = Math.max(0, currentEntry.endSec - elapsedSeconds)
  const currentStats = stats(current.id)
  const segmentDuration = currentEntry.endSec - currentEntry.startSec
  const segmentElapsed = Math.min(
    segmentDuration,
    Math.max(0, elapsedSeconds - currentEntry.startSec),
  )
  const segmentPct = segmentDuration > 0 ? (segmentElapsed / segmentDuration) * 100 : 0

  return (
    <div className="mx-auto max-w-md md:max-w-2xl">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 px-4 pb-3 pt-3 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBuildPlan}
            className="truncate text-left text-base font-bold text-neutral-900 dark:text-neutral-50"
          >
            {planEmoji} {planTitle} <span className="text-neutral-400">✎</span>
          </button>
          <span className="shrink-0 font-mono text-sm text-neutral-500 dark:text-neutral-400">
            {formatClock(elapsedSeconds)} / {totalMinutes}:00
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
          {unlocked
            ? '🔓 Synced live, controls here apply to every trainer'
            : '🔒 Viewing live, unlock trainer access on Groups to control'}
        </p>
        {controlError && <p className="mt-1 text-xs font-semibold text-red-600">{controlError}</p>}
      </header>

      {/* pb-44: reserves scroll room for the sticky footer below — without it, the footer just
       * paints over whatever content happens to be at that scroll position instead of the page
       * scrolling clear of it first. */}
      <main className="space-y-4 pb-44 pt-2">
        {isSessionDone ? (
          <Card className="mx-4 rounded-3xl p-6 text-center">
            <p className="text-4xl">🏆</p>
            <h2 className="mt-2 text-lg font-bold text-neutral-900 dark:text-neutral-50">
              Session complete!
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Great job, coaches. Time for high-fives and go home.
            </p>
          </Card>
        ) : null}

        {isSessionDone && unlocked && planId && (
          <PlayerProgressSection
            groupId={groupId}
            planId={planId}
            categories={sessionCategories}
          />
        )}

        {!isSessionDone && (
          <ExerciseTimeline
            currentEntry={currentEntry}
            remainingLabel={formatClock(remainingInSegment)}
            segmentPct={segmentPct}
            groupTemplateId={groupTemplateId}
            groupTemplateLabel={groupTemplateLabel}
            onRate={(value) => rate(current.id, value)}
            ratingAverage={currentStats.average}
            ratingCount={currentStats.count}
          />
        )}
      </main>

      {/* bottom-16 clears the fixed mobile BottomNav (hidden at lg, where bottom-0 is correct
       * since SideNav replaces it) so the two sticky bars never overlap. */}
      <footer className="sticky bottom-16 z-10 mt-4 border-t border-black/10 bg-white/90 px-4 pb-3 pt-3 backdrop-blur lg:bottom-0 lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-neutral-950/90">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => goToIndex(currentIndex - 1)}
            disabled={!unlocked || currentIndex === 0}
            className="rounded-2xl border border-black/10 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-30 dark:border-white/10 dark:text-neutral-200"
          >
            ⏮ Prev
          </button>
          <button
            type="button"
            disabled={!unlocked}
            onClick={() => {
              if (running) {
                pause()
                return
              }
              requestNotificationPermission()
              enterFullscreen()
              start()
            }}
            className="col-span-2 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white shadow-sm active:bg-orange-600 disabled:opacity-30"
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            type="button"
            onClick={() => goToIndex(currentIndex + 1)}
            disabled={!unlocked || currentIndex === timeline.length - 1}
            className="rounded-2xl border border-black/10 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-30 dark:border-white/10 dark:text-neutral-200"
          >
            Next ⏭
          </button>
        </div>
        {unlocked && (
          <button
            type="button"
            onClick={() => {
              exitFullscreen()
              reset()
            }}
            className="w-full pt-2 text-xs font-semibold text-neutral-400 active:text-neutral-600 dark:text-neutral-500"
          >
            Reset session clock
          </button>
        )}
      </footer>
    </div>
  )
}
