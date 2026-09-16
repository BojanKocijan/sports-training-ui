import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import { usePlans, type TrainingPlan } from '../hooks/usePlans'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { isApiConfigured } from '../lib/apiClient'
import { formatDate } from '../utils/format'
import { PlanTrainingWizard } from './PlanTrainingWizard'
import { TrainerAccessBar } from './TrainerAccessBar'

export function GroupsScreen({
  groupId,
  trainerAccess,
}: {
  groupId: string
  trainerAccess: ReturnType<typeof useTrainerAccess>
}) {
  const { groups } = useGroups()
  const group = groups.find((g) => g.id === groupId) ?? { name: groupId, emoji: '🏀' }
  const templateId = groups.find((g) => g.id === groupId)?.templateId ?? groupId
  // Always unlocked here — the app-level gate in App.tsx (see LockScreen) never renders this
  // screen otherwise.
  const { lock, passcode } = trainerAccess
  const { plans, upcoming, past, loading, error, createPlan, updatePlan, deletePlan } = usePlans(groupId)

  const [planning, setPlanning] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [nextTraining, ...restUpcoming] = upcoming
  const formOpen = planning || editingPlan !== null

  function startPlanning() {
    setEditingPlan(null)
    setPlanning(true)
    setSaveError(null)
  }

  function startEditing(plan: TrainingPlan) {
    setPlanning(false)
    setEditingPlan(plan)
    setSaveError(null)
  }

  function closeForm() {
    setPlanning(false)
    setEditingPlan(null)
  }

  async function savePlan(date: string, exerciseIds: string[]) {
    setSaving(true)
    setSaveError(null)
    try {
      if (editingPlan) {
        await updatePlan(passcode(), editingPlan.id, date, `${group.name} training`, group.emoji, exerciseIds)
      } else {
        await createPlan(passcode(), date, `${group.name} training`, group.emoji, exerciseIds)
      }
      closeForm()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save training')
    } finally {
      setSaving(false)
    }
  }

  async function removePlan(id: string) {
    setRemovingId(id)
    try {
      await deletePlan(passcode(), id)
      if (editingPlan?.id === id) closeForm()
    } catch {
      // surfaced via the shared `error` from usePlans on next refresh
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-4 md:max-w-2xl lg:max-w-3xl">
      <header>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Training planner</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Plan next week's training for {group.name} together with the other trainers.
        </p>
      </header>

      {!isApiConfigured && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Shared planning isn't set up yet — add <code>VITE_API_URL</code> (see{' '}
          <code>.env.example</code>) to connect a sports-training-api deployment.
        </div>
      )}

      <TrainerAccessBar onLock={lock} />

      {error && <p className="text-sm text-red-600">Could not load plans: {error}</p>}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Next training
        </h2>
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : !nextTraining ? (
          <p className="text-sm text-neutral-400">Nothing scheduled yet.</p>
        ) : (
          <div className="rounded-3xl border-2 border-orange-500 bg-orange-50 p-4 dark:bg-orange-500/10">
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              {nextTraining.emoji} {formatDate(nextTraining.training_date)}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {nextTraining.exercise_ids.length} exercises · plan this with the other trainer
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => startEditing(nextTraining)}
                className="text-xs font-bold text-orange-700 dark:text-orange-300"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={removingId === nextTraining.id}
                onClick={() => removePlan(nextTraining.id)}
                className="text-xs font-semibold text-red-500 disabled:opacity-50"
              >
                {removingId === nextTraining.id ? '…' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Also upcoming
          </h2>
          {!formOpen && (
            <button type="button" onClick={startPlanning} className="text-xs font-bold text-orange-600">
              + Plan a training
            </button>
          )}
        </div>

        {!loading && restUpcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">No other trainings scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {restUpcoming.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
              >
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    {p.emoji} {formatDate(p.training_date)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {p.exercise_ids.length} exercises
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(p)}
                    className="text-xs font-bold text-orange-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={removingId === p.id}
                    onClick={() => removePlan(p.id)}
                    className="text-xs font-semibold text-red-500 disabled:opacity-50"
                  >
                    {removingId === p.id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <PlanTrainingWizard
          key={editingPlan?.id ?? 'new'}
          mode={editingPlan ? 'edit' : 'create'}
          initialDate={editingPlan?.training_date ?? ''}
          initialExerciseIds={editingPlan?.exercise_ids ?? []}
          groupLabel={group.name}
          templateId={templateId}
          takenDates={plans.filter((p) => p.id !== editingPlan?.id).map((p) => p.training_date)}
          saving={saving}
          saveError={saveError}
          onCancel={closeForm}
          onSave={savePlan}
        />
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Past</h2>
          <div className="grid grid-cols-1 gap-2 opacity-60 md:grid-cols-2">
            {past
              .slice()
              .reverse()
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
                >
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    {p.emoji} {formatDate(p.training_date)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {p.exercise_ids.length} exercises
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

    </div>
  )
}
