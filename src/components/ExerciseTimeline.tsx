import { guidanceForGroup, type Exercise } from '../hooks/useExercises'
import { CategoryBadges } from './CategoryBadges'
import { RatingWidget } from './RatingWidget'
import { Card } from './ui/card'

export interface TimelineEntry {
  exercise: Exercise
  startSec: number
  endSec: number
}

function timeRangeLabel(startSec: number, endSec: number) {
  const fmt = (s: number) => `${Math.floor(s / 60)}:00`
  return `${fmt(startSec)} – ${fmt(endSec)}`
}

/** Only the exercise currently in progress — during a live session, showing the whole plan's
 * timeline just makes trainers scroll past exercises that already happened. Prev/Next in
 * SessionScreen's sticky footer are the only way to move between exercises now. */
export function ExerciseTimeline({
  currentEntry,
  remainingLabel,
  segmentPct,
  groupTemplateId,
  groupTemplateLabel,
  onRate,
  ratingAverage,
  ratingCount,
}: {
  currentEntry: TimelineEntry
  remainingLabel: string
  segmentPct: number
  groupTemplateId: string
  groupTemplateLabel: string
  onRate: (value: number) => void
  ratingAverage: number | null
  ratingCount: number
}) {
  const { exercise } = currentEntry
  const guidance = guidanceForGroup(exercise, groupTemplateId)

  return (
    <div className="px-4 pt-2">
      <Card className="rounded-3xl border-2 border-orange-500 px-4 shadow-sm hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
              {timeRangeLabel(currentEntry.startSec, currentEntry.endSec)}
            </div>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-neutral-50">
              <span>{exercise.emoji}</span>
              {exercise.title}
            </h2>
            {exercise.subtitle && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{exercise.subtitle}</p>
            )}
          </div>
          <div className="shrink-0 rounded-2xl bg-neutral-900 px-3 py-2 text-center text-white dark:bg-white dark:text-neutral-900">
            <div className="font-mono text-lg font-bold leading-none">{remainingLabel}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-70">left</div>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${segmentPct}%` }}
          />
        </div>

        {!exercise.isBreak && (
          <div className="mt-3">
            <CategoryBadges categories={exercise.categories} />
          </div>
        )}

        <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
          🎯 {exercise.goal}
        </p>

        {guidance && (
          <aside
            aria-label={`Coaching guidance for ${groupTemplateLabel}`}
            className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 dark:border-sky-400/20 dark:bg-sky-400/10"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
              🧠 Coach {groupTemplateLabel}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-sky-950 dark:text-sky-100">
              {guidance}
            </p>
          </aside>
        )}

        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          {exercise.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        {exercise.cues && exercise.cues.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {exercise.cues.map((cue) => (
              <span
                key={cue.nl}
                className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <span className="font-semibold">{cue.nl}</span>
                <span className="mx-1 text-neutral-400">·</span>
                {cue.en}
              </span>
            ))}
          </div>
        )}

        {!exercise.isBreak && (
          <div className="mt-4">
            <RatingWidget onRate={onRate} average={ratingAverage} count={ratingCount} />
          </div>
        )}
      </Card>
    </div>
  )
}
