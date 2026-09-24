import { useState } from 'react'
import type { Exercise } from '../hooks/useExercises'
import { useCountdown } from '../hooks/useCountdown'
import { CategoryBadges } from './CategoryBadges'
import { RatingWidget } from './RatingWidget'
import { Button } from './ui/button'
import { Card } from './ui/card'

export function ExerciseLibraryCard({
  exercise,
  onRate,
  ratingAverage,
  ratingCount,
}: {
  exercise: Exercise
  onRate: (value: number) => void
  ratingAverage: number | null
  ratingCount: number
}) {
  const [expanded, setExpanded] = useState(false)
  const { remaining, running, start, pause, reset } = useCountdown(exercise.durationMinutes * 60)
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <Card className="px-4">
      <Button
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        className="h-auto min-h-11 w-full items-start justify-start py-3 px-0 text-left hover:bg-transparent"
      >
        <div className="w-full">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 truncate font-bold text-foreground">
              <span>{exercise.emoji}</span>
              {exercise.title}
            </h3>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {exercise.durationMinutes}′
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{exercise.goal}</p>
          <div className="mt-2 flex items-center gap-2">
            <CategoryBadges categories={exercise.categories} />
            {ratingCount > 0 && ratingAverage !== null && (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                🤩 {ratingAverage.toFixed(1)} · {ratingCount}×
              </span>
            )}
          </div>
        </div>
      </Button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <Card className="flex items-center justify-between rounded-xl border-0 bg-muted px-3 py-2 shadow-none hover:shadow-none [--card-spacing:0]">
            <span className="font-mono text-xl font-bold text-foreground">
              {mm}:{ss.toString().padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              {/* size="md" over "sm" on purpose: these are the live-session timer controls a
               * trainer taps mid-practice — a bigger tap target matters more here than for a
               * static list button. */}
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

          <RatingWidget onRate={onRate} average={ratingAverage} count={ratingCount} />
        </div>
      )}
    </Card>
  )
}
