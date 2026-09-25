import { useState } from 'react'
import type { Exercise } from '../hooks/useExercises'
import { useCountdown } from '../hooks/useCountdown'
import { CategoryBadges } from './CategoryBadges'
import { RatingWidget } from './RatingWidget'
import { Button } from './ui/button'
import { Card } from './ui/card'

/** The one exercise card, everywhere an exercise is listed: the library and the planner's picker.
 * A plain clickable div/button, not the shadcn `Button` used for the row (that component's
 * `size="default"` height only overrides at the unprefixed breakpoint — `h-auto` alone leaves its
 * `sm:h-8` in place at wider widths, clipping any card taller than a single line and bleeding its
 * content into the row below). Native elements here means there's no height utility to fight. */
export function ExerciseCard({
  exercise,
  selected,
  onToggle,
  onRate,
  ratingAverage,
  ratingCount,
}: {
  exercise: Exercise
  /** Selection checkbox on the left, for the planner's picker. Omit it in the library, where the
   * whole card only opens details. */
  selected?: boolean
  onToggle?: () => void
  onRate?: (value: number) => void
  ratingAverage?: number | null
  ratingCount?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const { remaining, running, start, pause, reset } = useCountdown(exercise.durationMinutes * 60)
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const selectable = onToggle !== undefined

  return (
    <Card className="px-4">
      <div className="flex w-full items-start gap-3 py-3">
        {selectable && (
          <button
            type="button"
            aria-pressed={selected}
            aria-label={selected ? `Remove ${exercise.title}` : `Add ${exercise.title}`}
            onClick={onToggle}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/40 bg-background text-transparent'
            }`}
          >
            ✓
          </button>
        )}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 truncate font-bold text-foreground">
              <span>{exercise.emoji}</span>
              {exercise.title}
            </h3>
            {/* Bigger and bolder than the rest of the header: this is the number a trainer scans
             * for when totting up a training's length. */}
            <span className="shrink-0 text-sm font-bold text-foreground">{exercise.durationMinutes}′</span>
          </div>
          <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{exercise.goal}</p>
          <div className="mt-2 flex items-center gap-2">
            <CategoryBadges categories={exercise.categories} />
            {ratingCount != null && ratingCount > 0 && ratingAverage != null && (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                🤩 {ratingAverage.toFixed(1)} · {ratingCount}×
              </span>
            )}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border px-0 pb-1 pt-4">
          <Card className="flex items-center justify-between rounded-xl border-0 bg-muted px-3 py-2 shadow-none hover:shadow-none [--card-spacing:0]">
            <span className="font-mono text-xl font-bold text-foreground">
              {mm}:{ss.toString().padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              <Button variant="default" onClick={running ? pause : start}>
                {running ? '⏸' : '▶'}
              </Button>
              <Button variant="secondary" onClick={reset}>
                ↺
              </Button>
            </div>
          </Card>

          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/80">
            {exercise.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {exercise.cues && exercise.cues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {exercise.cues.map((cue) => (
                <span
                  key={cue.nl}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground/80"
                >
                  <span className="font-semibold">{cue.nl}</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  {cue.en}
                </span>
              ))}
            </div>
          )}

          {onRate && (
            <RatingWidget onRate={onRate} average={ratingAverage ?? null} count={ratingCount ?? 0} />
          )}
        </div>
      )}
    </Card>
  )
}
