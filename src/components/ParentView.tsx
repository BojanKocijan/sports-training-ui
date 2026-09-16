import type { ParentPlayer } from '../hooks/useTrainerAccess'
import { categoryInfo, useCategories } from '../hooks/useCategories'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import { usePlans } from '../hooks/usePlans'
import { formatDate } from '../utils/format'
import { GroupProgressSummary } from './GroupProgressSummary'
import { TrainerAccessBar } from './TrainerAccessBar'

/** Read-only view unlocked by a parent code (see sports-training-api#20) — scoped to one child
 * plus the group's overall progress and schedule. No edit controls anywhere, no way to switch
 * to another child or group: unlike the trainer app, this isn't a tabbed shell, just one page. */
export function ParentView({
  groupId,
  player,
  onLock,
}: {
  groupId: string
  player: ParentPlayer
  onLock: () => void
}) {
  const { byCategory, loading, error } = usePlayerProgress(player.id)
  const { categories } = useCategories()
  const { upcoming, loading: plansLoading } = usePlans(groupId)

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-24 pt-4 md:max-w-2xl">
      <header>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
          {player.nickname}'s progress
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A read-only view for parents — no edit controls here.
        </p>
      </header>

      <TrainerAccessBar onLock={onLock} label={`✓ Viewing ${player.nickname}'s progress`} />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {player.nickname}'s progress
        </h2>
        {error && <p className="mb-2 text-sm text-red-600">Could not load progress: {error}</p>}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : byCategory.length === 0 ? (
          <p className="text-sm text-neutral-400">No ratings logged yet.</p>
        ) : (
          <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900">
            {byCategory.map((c) => {
              const cat = categoryInfo(categories, c.categoryId)
              return (
                <div key={c.categoryId} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    {cat.emoji} {cat.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${(c.average / 3) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-neutral-400">
                    {c.average.toFixed(1)} · {c.count}×
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <GroupProgressSummary groupId={groupId} />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Upcoming trainings
        </h2>
        {plansLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">Nothing scheduled yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {upcoming.map((p) => (
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
        )}
      </section>
    </div>
  )
}
