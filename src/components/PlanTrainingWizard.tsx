import { useState } from 'react'
import { type CategoryId, useCategories } from '../hooks/useCategories'
import { exercisesForGroup, findExercise, useExercises } from '../hooks/useExercises'
import { TrainingDateStep } from './TrainingDateStep'
import { TrainingExercisesStep } from './TrainingExercisesStep'
import { TrainingFocusStep } from './TrainingFocusStep'
import { TrainingMinutesBadge } from './TrainingMinutesBadge'
import { Button } from './ui/button'

const STEPS = ['When?', 'Focus', 'Exercises'] as const

export function PlanTrainingWizard({
  mode,
  initialDate,
  initialExerciseIds,
  groupLabel,
  templateId,
  takenDates,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit'
  initialDate: string
  initialExerciseIds: string[]
  groupLabel: string
  /** The group's template id (see group_templates) — narrows the exercise picker to what's
   * appropriate for this age band instead of the full library. */
  templateId: string
  /** Dates (YYYY-MM-DD) this group already has a training on — one training per date, per group. */
  takenDates: string[]
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (date: string, exerciseIds: string[]) => void
}) {
  const { categories } = useCategories()
  const { exercises } = useExercises()
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(initialDate)
  const takenDateSet = new Set(takenDates)
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(initialExerciseIds))

  const trainable = exercisesForGroup(exercises, templateId).filter((e) => !e.isBreak)
  const filtered =
    activeCategories.length === 0
      ? trainable
      : trainable.filter((e) => e.categories.some((c) => activeCategories.includes(c)))
  const selectedMinutes = [...selected]
    .map((id) => findExercise(exercises, id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .reduce((sum, e) => sum + e.durationMinutes, 0)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCategory(id: CategoryId) {
    setActiveCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const canGoNext = step === 1 ? Boolean(date) && !takenDateSet.has(date) : true
  const canSave = Boolean(date) && !takenDateSet.has(date) && selected.size > 0

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="shrink-0 border-b border-black/10 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
            {mode === 'edit' ? 'Edit training' : 'Plan a training'}
          </h2>
          <TrainingMinutesBadge minutes={selectedMinutes} exerciseCount={selected.size} />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {STEPS.map((label, i) => {
            const n = i + 1
            return (
              <div
                key={label}
                className={`h-1.5 flex-1 rounded-full ${
                  n <= step ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              />
            )
          })}
        </div>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Step {step} of {STEPS.length} · {STEPS[step - 1]}
        </p>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto px-4 py-4 md:max-w-2xl lg:max-w-3xl">
        {step === 1 && (
          <TrainingDateStep date={date} onChange={setDate} groupLabel={groupLabel} takenDateSet={takenDateSet} />
        )}
        {step === 2 && (
          <TrainingFocusStep categories={categories} activeCategories={activeCategories} onToggle={toggleCategory} />
        )}
        {step === 3 && (
          <>
            <TrainingExercisesStep exercises={filtered} selected={selected} onToggle={toggleSelect} />
            {saveError && <p className="text-xs font-semibold text-red-600">{saveError}</p>}
          </>
        )}
      </main>

      <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-2xl lg:max-w-3xl">
          <Button
            variant="outline"
            size="lg"
            shape="pill"
            className="flex-1"
            onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length ? (
            <Button
              size="lg"
              shape="pill"
              className="flex-1"
              disabled={!canGoNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              size="lg"
              shape="pill"
              className="flex-1"
              disabled={saving || !canSave}
              onClick={() => onSave(date, [...selected])}
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Save training'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
