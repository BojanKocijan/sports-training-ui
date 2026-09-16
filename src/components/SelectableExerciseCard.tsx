import type { Exercise } from '../hooks/useExercises'
import { CategoryBadges } from './CategoryBadges'
import { Button } from './ui/Button'

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
    <Button
      variant="secondary"
      fullWidth
      onClick={onToggle}
      className="!items-start justify-start gap-3 px-4 py-3 text-left"
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
        {/* font-normal: Button's own label text is font-semibold, which is inherited unless
         * overridden — this line is de-emphasized body text, not a label. */}
        <p className="mt-0.5 truncate text-xs font-normal text-neutral-500 dark:text-neutral-400">
          {exercise.goal}
        </p>
        <div className="mt-2">
          <CategoryBadges categories={exercise.categories} />
        </div>
      </div>
    </Button>
  )
}
