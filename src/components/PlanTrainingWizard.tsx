import { useState } from 'react'
import { type CategoryId, useCategories } from '../hooks/useCategories'
import { exercisesForGroup, findExercise, useExercises } from '../hooks/useExercises'
import { formatDate } from '../utils/format'
import { Calendar } from './Calendar'
import { CategoryCard } from './CategoryCard'
import { SelectableExerciseCard } from './SelectableExerciseCard'

const STEPS = ['When?', 'Focus', 'Exercises', 'Review'] as const

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
  const selectedExercises = [...selected]
    .map((id) => findExercise(exercises, id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
  const selectedMinutes = selectedExercises.reduce((sum, e) => sum + e.durationMinutes, 0)

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

  const canGoNext =
    step === 1
      ? Boolean(date) && !takenDateSet.has(date)
      : step === 3
        ? selected.size > 0
        : true

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="shrink-0 border-b border-black/10 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
          {mode === 'edit' ? 'Edit training' : 'Plan a training'}
        </h2>
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
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Training date
            </label>
            <div className="mt-1">
              <Calendar
                value={date}
                onChange={setDate}
                markedDates={takenDateSet}
                disabledDates={takenDateSet}
              />
            </div>
            {date && takenDateSet.has(date) && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {groupLabel} already has a training on this date — pick another day.
              </p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> already has a training
              planned
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
              Optionally narrow the exercise list to a focus for this training.
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  categoryId={cat.id}
                  active={activeCategories.includes(cat.id)}
                  onToggle={() => toggleCategory(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              {selected.size} selected · {selectedMinutes}′
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {filtered.map((ex) => (
                <SelectableExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selected={selected.has(ex.id)}
                  onToggle={() => toggleSelect(ex.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                {groupLabel} · {formatDate(date)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selected.size} exercises · {selectedMinutes}′ total
              </p>
            </div>
            <ul className="space-y-1.5">
              {selectedExercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
                >
                  <span>
                    {ex.emoji} {ex.title}
                  </span>
                  <span className="text-xs text-neutral-400">{ex.durationMinutes}′</span>
                </li>
              ))}
            </ul>
            {saveError && <p className="text-xs font-semibold text-red-600">{saveError}</p>}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-2xl lg:max-w-3xl">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}
            className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length ? (
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(date, [...selected])}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save training'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
