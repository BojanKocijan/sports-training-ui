import { useState } from 'react'
import type { Exercise } from '../hooks/useExercises'
import { useCountdown } from '../hooks/useCountdown'
import { CategoryBadges } from './CategoryBadges'
import { RatingWidget } from './RatingWidget'

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
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 truncate font-bold text-neutral-900 dark:text-neutral-50">
            <span>{exercise.emoji}</span>
            {exercise.title}
          </h3>
          <span className="shrink-0 text-xs font-semibold text-neutral-400">
            {exercise.durationMinutes}′
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {exercise.goal}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <CategoryBadges categories={exercise.categories} />
          {ratingCount > 0 && ratingAverage !== null && (
            <span className="shrink-0 text-xs font-medium text-neutral-400">
              🤩 {ratingAverage.toFixed(1)} · {ratingCount}×
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4 dark:border-white/5">
          <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
            <span className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-50">
              {mm}:{ss.toString().padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={running ? pause : start}
                className="rounded-xl bg-orange-500 px-4 py-1.5 text-sm font-bold text-white active:bg-orange-600"
              >
                {running ? '⏸' : '▶'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-black/10 px-3 py-1.5 text-sm font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
              >
                ↺
              </button>
            </div>
          </div>

          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {exercise.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {exercise.cues && exercise.cues.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

          <RatingWidget onRate={onRate} average={ratingAverage} count={ratingCount} />
        </div>
      )}
    </div>
  )
}
