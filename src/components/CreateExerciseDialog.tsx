import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import type { CustomExerciseInput, Exercise, ExerciseIcon as ExerciseIconValue } from '../hooks/useExercises'
import { useCustomExercises } from '../hooks/useExercises'
import { CategoryChip } from './CategoryChip'
import { IconPicker } from './IconPicker'
import { Button } from './ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'

function toInput(exercise?: Exercise): CustomExerciseInput {
  return {
    title: exercise?.title ?? '',
    goal: exercise?.goal ?? '',
    steps: exercise?.steps && exercise.steps.length > 0 ? exercise.steps : [''],
    categories: (exercise?.categories ?? []).filter((c) => c !== 'trainer_addons'),
    durationMinutes: exercise?.durationMinutes ?? 5,
    icon: exercise?.iconKind === 'library' && exercise.iconValue
      ? { kind: 'library', value: exercise.iconValue }
      : { kind: 'emoji', value: exercise?.emoji ?? '🏀' },
  }
}

/** Create or edit a trainer's own exercise (sports-training-api#98) — same fields as the seeded
 * library (title, goal, steps, categories, duration), plus the icon-or-emoji choice. Available
 * on every tier; sharing it with the club is a separate, later step from the card itself. */
export function CreateExerciseDialog({
  open,
  onOpenChange,
  clubId,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  /** Present when editing an existing custom exercise instead of creating a new one. */
  editing?: Exercise
  onSaved: (exercise: Exercise) => void
}) {
  const { categories } = useCategories()
  const { createExercise, updateExercise } = useCustomExercises()
  const [input, setInput] = useState<CustomExerciseInput>(() => toInput(editing))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset(next: Exercise | undefined) {
    setInput(toInput(next))
    setError(null)
  }

  function updateStep(index: number, value: string) {
    setInput((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === index ? value : s)) }))
  }

  function addStep() {
    setInput((prev) => ({ ...prev, steps: [...prev.steps, ''] }))
  }

  function removeStep(index: number) {
    setInput((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }))
  }

  function toggleCategory(id: string) {
    setInput((prev) => ({
      ...prev,
      categories: prev.categories.includes(id) ? prev.categories.filter((c) => c !== id) : [...prev.categories, id],
    }))
  }

  const steps = input.steps.map((s) => s.trim()).filter(Boolean)
  const canSave = input.title.trim().length > 0 && input.goal.trim().length > 0 && steps.length > 0
    && input.durationMinutes > 0 && (input.icon.kind === 'emoji' ? input.icon.value.trim().length > 0 : true)
  const isDirty = JSON.stringify(input) !== JSON.stringify(toInput(editing))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const body: CustomExerciseInput = { ...input, steps }
      const saved = editing ? await updateExercise(editing.id, body) : await createExercise(clubId, body)
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this exercise')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(editing)
        onOpenChange(next)
      }}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        confirmClose={() => !isDirty || window.confirm('Discard this exercise? Your changes will be lost.')}
      >
        <DialogTitle>{editing ? 'Edit your exercise' : 'Create your own exercise'}</DialogTitle>
        <DialogDescription>
          {editing ? 'Only you can see or change this.' : 'Private to you — you can share it with your club later.'}
        </DialogDescription>

        <div className="mt-2 space-y-4">
          <div>
            <label htmlFor="exercise-title" className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Title</label>
            <input
              id="exercise-title"
              type="text"
              value={input.title}
              onChange={(e) => setInput((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="exercise-goal" className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Goal</label>
            <input
              id="exercise-goal"
              type="text"
              value={input.goal}
              onChange={(e) => setInput((prev) => ({ ...prev, goal: e.target.value }))}
              placeholder="What does this exercise build?"
              className="mt-1 block w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="exercise-duration" className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Duration (minutes)</label>
            <input
              id="exercise-duration"
              type="number"
              min={1}
              value={input.durationMinutes}
              onChange={(e) => setInput((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
              className="mt-1 block w-24 rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Steps</label>
            <div className="mt-1 space-y-2">
              {input.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  />
                  {input.steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="shrink-0 text-xs text-muted-foreground underline">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addStep} className="mt-2 text-xs font-semibold text-orange-600 underline">
              + Add step
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Categories</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {categories.filter((c) => c.id !== 'trainer_addons').map((cat) => (
                <CategoryChip key={cat.id} categoryId={cat.id} active={input.categories.includes(cat.id)} onToggle={() => toggleCategory(cat.id)} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Icon</label>
            <div className="mt-1">
              <IconPicker value={input.icon} onChange={(icon: ExerciseIconValue) => setInput((prev) => ({ ...prev, icon }))} />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">Cancel</Button>
          </DialogClose>
          <Button className="flex-1" disabled={!canSave || saving} onClick={save}>
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Create exercise'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
