import { useMemo, useState } from 'react'
import { useActiveGroup } from '../hooks/useActiveGroup'
import { type CategoryId, useCategories } from '../hooks/useCategories'
import { useClub } from '../hooks/useClub'
import { exercisesForGroup, useCustomExercises, useExercises, type Exercise } from '../hooks/useExercises'
import { useGroups } from '../hooks/useGroups'
import { useRatings } from '../hooks/useRatings'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { CategoryChip } from './CategoryChip'
import { CreateExerciseDialog } from './CreateExerciseDialog'
import { ExerciseCard } from './ExerciseCard'
import { ShareStatusBadge } from './ShareStatusBadge'
import { Button } from './ui/button'

const SHARE_VISIBLE_TIERS = new Set(['club', 'federation'])

function OwnerActions({
  exercise,
  clubTier,
  onEdit,
}: {
  exercise: Exercise
  clubTier: string | null
  onEdit: () => void
}) {
  const { deleteExercise, requestShare } = useCustomExercises()
  const [busy, setBusy] = useState<'delete' | 'share' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canShareNow = clubTier != null && SHARE_VISIBLE_TIERS.has(clubTier)
  const canRequestShare = exercise.shareStatus === 'none' || exercise.shareStatus === 'rejected'

  async function handleDelete() {
    setBusy('delete')
    setError(null)
    try {
      await deleteExercise(exercise.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this exercise')
      setBusy(null)
    }
  }

  async function handleShare() {
    setBusy('share')
    setError(null)
    try {
      await requestShare(exercise.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not request sharing')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Your exercise</span>
        <ShareStatusBadge status={exercise.shareStatus ?? 'none'} />
      </div>
      {exercise.shareStatus === 'rejected' && exercise.shareRejectedReason && (
        <p className="text-xs text-red-600">Not shared: {exercise.shareRejectedReason}</p>
      )}
      {exercise.usedByOtherTrainers != null && exercise.usedByOtherTrainers > 0 && (
        <p className="text-xs text-muted-foreground">
          Used by {exercise.usedByOtherTrainers} other trainer{exercise.usedByOtherTrainers === 1 ? '' : 's'}.
        </p>
      )}
      {!canShareNow && canRequestShare && (
        <p className="text-xs text-muted-foreground">
          Sharing only takes effect once your club is on the Club tier — you can still ask now and it'll apply automatically once you're upgraded.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="destructive" disabled={busy === 'delete'} onClick={handleDelete}>
          {busy === 'delete' ? 'Deleting...' : 'Delete'}
        </Button>
        {canRequestShare && (
          <Button size="sm" variant="outline" disabled={busy === 'share'} onClick={handleShare}>
            {busy === 'share' ? 'Requesting...' : 'Share with club'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

export function ExercisesScreen({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([])
  const { groupId } = useActiveGroup()
  const { rate, stats } = useRatings(groupId)
  const { groups } = useGroups()
  const { categories } = useCategories()
  const { exercises, loading, error } = useExercises()
  const club = useClub()
  const activeGroup = groups.find((g) => g.id === groupId)
  const templateId = activeGroup?.templateId ?? groupId
  const [dialogState, setDialogState] = useState<{ open: boolean; editing?: Exercise }>({ open: false })
  // A superadmin has no trainer_memberships row at all (their access bypasses membership checks
  // entirely, both here and on the API), so trainerAccess.clubId - which only ever comes from a
  // membership - is always null for them. Since this app serves a single club today, their own
  // club-wide access falls back to that one club's id instead of hiding "Create exercise" outright.
  const clubId = trainerAccess.clubId ?? (trainerAccess.isSuperadmin ? club.id : null)

  const trainable = exercisesForGroup(exercises, templateId).filter((e) => !e.isBreak)

  function toggleCategory(id: CategoryId) {
    setActiveCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trainable.filter((e) => {
      const matchesQuery = !q || e.title.toLowerCase().includes(q) || e.goal.toLowerCase().includes(q)
      const matchesCategory =
        activeCategories.length === 0 || e.categories.some((c) => activeCategories.includes(c))
      return matchesQuery && matchesCategory
    })
  }, [query, activeCategories, trainable])

  if (loading || error || exercises.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4">
        <p className="text-sm text-neutral-400">
          {error ? `Could not load exercises: ${error}` : 'Loading exercises...'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4 md:max-w-3xl lg:max-w-5xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Exercise library</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {activeGroup ? `${activeGroup.name}'s exercise library. ` : 'The full exercise library. '}
            Tap one to see the steps, run its timer, or rate it.
          </p>
        </div>
        {clubId && (
          <Button size="sm" shape="pill" className="shrink-0" onClick={() => setDialogState({ open: true })}>
            + Create exercise
          </Button>
        )}
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search an exercise..."
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            categoryId={cat.id}
            active={activeCategories.includes(cat.id)}
            onToggle={() => toggleCategory(cat.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((exercise) => {
          const s = stats(exercise.id)
          const isOwn = exercise.isCustom && exercise.ownerAccountId === trainerAccess.userId
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onRate={(value) => rate(exercise.id, value)}
              ratingAverage={s.average}
              ratingCount={s.count}
              statusBadge={isOwn ? <ShareStatusBadge status={exercise.shareStatus ?? 'none'} /> : undefined}
              ownerActions={isOwn ? (
                <OwnerActions
                  exercise={exercise}
                  clubTier={club.tier}
                  onEdit={() => setDialogState({ open: true, editing: exercise })}
                />
              ) : undefined}
            />
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-400">No matches.</p>
        )}
      </div>

      {clubId && (
        <CreateExerciseDialog
          open={dialogState.open}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
          clubId={clubId}
          editing={dialogState.editing}
          onSaved={() => setDialogState({ open: false })}
        />
      )}
    </div>
  )
}
