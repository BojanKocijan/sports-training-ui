import type { Exercise } from '../hooks/useExercises'
import { ExerciseCard } from './ExerciseCard'

export function TrainingExercisesStep({
  exercises,
  selected,
  onToggle,
}: {
  exercises: Exercise[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {exercises.map((ex) => (
        <ExerciseCard key={ex.id} exercise={ex} selected={selected.has(ex.id)} onToggle={() => onToggle(ex.id)} />
      ))}
    </div>
  )
}
