import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import { usePlans, type TrainingPlan } from '../hooks/usePlans'
import { isApiConfigured } from '../lib/apiClient'
import { formatDate } from '../utils/format'
import { PlanTrainingWizard } from './PlanTrainingWizard'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Skeleton } from './ui/skeleton'

export function GroupsScreen({
  groupId,
}: {
  groupId: string
}) {
  const { groups } = useGroups()
  const group = groups.find((g) => g.id === groupId) ?? { name: groupId, emoji: '🏀' }
  const templateId = groups.find((g) => g.id === groupId)?.templateId ?? groupId
  // Always unlocked here — the app-level gate in App.tsx (see LockScreen) never renders this
  // screen otherwise.
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
        await updatePlan(editingPlan.id, date, `${group.name} training`, group.emoji, exerciseIds)
      } else {
        await createPlan(date, `${group.name} training`, group.emoji, exerciseIds)
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
      await deletePlan(id)
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
          Shared planning isn't set up yet, add <code>VITE_API_URL</code> (see{' '}
          <code>.env.example</code>) to connect a sports-training-api deployment.
        </div>
      )}

      {error && <p className="text-sm text-red-600">Could not load plans: {error}</p>}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Next training
        </h2>
        {loading ? (
          <Card className="gap-1 rounded-3xl px-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-8 w-14 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </Card>
        ) : !nextTraining ? (
          <p className="text-sm text-neutral-400">Nothing scheduled yet.</p>
        ) : (
          <Card
            role="button"
            tabIndex={0}
            onClick={() => startEditing(nextTraining)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                startEditing(nextTraining)
              }
            }}
            className="cursor-pointer gap-1 rounded-3xl border-2 border-orange-500 bg-orange-50 px-4 dark:bg-orange-500/10"
          >
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              {nextTraining.emoji} {formatDate(nextTraining.training_date)}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {nextTraining.exercise_ids.length} exercises · plan this with the other trainer
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(nextTraining)
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={removingId === nextTraining.id}
                onClick={(e) => {
                  e.stopPropagation()
                  removePlan(nextTraining.id)
                }}
              >
                {removingId === nextTraining.id ? '...' : 'Remove'}
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Also upcoming
          </h2>
          {!formOpen && (
            <Button variant="secondary" size="sm" onClick={startPlanning}>
              + Plan a training
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i} size="sm" className="flex-row items-center justify-between gap-2 px-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : restUpcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">No other trainings scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {restUpcoming.map((p) => (
              <Card
                key={p.id}
                size="sm"
                role="button"
                tabIndex={0}
                onClick={() => startEditing(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    startEditing(p)
                  }
                }}
                className="cursor-pointer flex-row items-center justify-between gap-2 px-3"
              >
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    {p.emoji} {formatDate(p.training_date)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {p.exercise_ids.length} exercises
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(p)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removingId === p.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      removePlan(p.id)
                    }}
                  >
                    {removingId === p.id ? '...' : 'Remove'}
                  </Button>
                </div>
              </Card>
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
                <Card key={p.id} size="sm" className="px-3">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                    {p.emoji} {formatDate(p.training_date)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {p.exercise_ids.length} exercises
                  </p>
                </Card>
              ))}
          </div>
        </section>
      )}

    </div>
  )
}
