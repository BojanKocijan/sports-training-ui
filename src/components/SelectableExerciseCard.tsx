import type { Exercise } from '../hooks/useExercises'
import { CategoryBadges } from './CategoryBadges'

export function SelectableExerciseCard({
  exercise,
  selected,
  onToggle,
}: {
  exercise: Exercise
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left dark:border-white/10 dark:bg-neutral-900"
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
          selected
            ? 'border-orange-500 bg-orange-500 text-white'
            : 'border-neutral-300 text-transparent dark:border-neutral-600'
        }`}
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
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
        <div className="mt-2">
          <CategoryBadges categories={exercise.categories} />
        </div>
      </div>
    </button>
  )
}
