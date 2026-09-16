import type { Exercise } from '../hooks/useExercises'
import { CategoryBadges } from './CategoryBadges'
import { Button } from './ui/button'

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
      onClick={onToggle}
      className="h-auto w-full items-start justify-start gap-3 px-4 py-3 text-left"
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40 bg-background text-transparent'
        }`}
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 truncate font-bold text-foreground">
            <span>{exercise.emoji}</span>
            {exercise.title}
          </h3>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {exercise.durationMinutes}′
          </span>
        </div>
        {/* font-normal: Button's own label text carries its own weight, inherited unless
         * overridden — this line is de-emphasized body text, not a label. */}
        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{exercise.goal}</p>
        <div className="mt-2">
          <CategoryBadges categories={exercise.categories} />
        </div>
      </div>
    </Button>
  )
}
