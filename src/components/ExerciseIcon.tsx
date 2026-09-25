import type { Exercise } from '../hooks/useExercises'
import { EXERCISE_ICON_LIBRARY } from './ExerciseIconLibrary'

/** An exercise's icon, whichever kind it is: a seeded/emoji-chosen exercise shows its emoji, a
 * custom exercise built from the icon library shows that icon instead. */
export function ExerciseIcon({ exercise, className = 'h-5 w-5' }: { exercise: Exercise; className?: string }) {
  if (exercise.iconKind === 'library' && exercise.iconValue) {
    const Glyph = EXERCISE_ICON_LIBRARY[exercise.iconValue]
    if (Glyph) return <Glyph aria-hidden className={`inline-block shrink-0 text-orange-500 ${className}`} stroke={2} />
  }
  return <span aria-hidden>{exercise.emoji}</span>
}
