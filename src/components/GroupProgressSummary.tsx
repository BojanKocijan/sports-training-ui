import { useGroupProgress } from '../hooks/useGroupProgress'
import { SportLoader } from './SportLoader'

/** Group-level rollup of every rating logged for this group's players — the "individual
 * players as a team" payoff: not any one kid's report card, just an at-a-glance sense of
 * which skills this group has actually been trained (and rated) on. */
export function GroupProgressSummary({ groupId }: { groupId: string }) {
  const { byCategory, loading, error } = useGroupProgress(groupId)

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Group progress
      </h2>

      {error && <p className="mb-2 text-sm text-red-600">Could not load progress: {error}</p>}

      {loading ? (
        <SportLoader />
      ) : byCategory.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No ratings logged yet — rate players during a training to build this up.
        </p>
      ) : (
        <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900">
          {byCategory.map((c) => (
            <div key={c.categoryId} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {c.emoji} {c.label}
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
          ))}
        </div>
      )}
    </section>
  )
}
