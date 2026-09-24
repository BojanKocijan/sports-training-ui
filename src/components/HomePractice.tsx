import type { Exercise } from '../hooks/useExercises'
import type { PlayerCategoryStat } from '../hooks/usePlayerProgress'
import { homeExercisesFor, practiceCategories } from '../utils/parentGuidance'
import { Card } from './ui/card'

/** "Practise together" (#131): for categories the child's ratings are low in, a couple of
 * exercises a parent and child can try at home. Encouraging framing only (#106). Renders nothing
 * when there is nothing to suggest. */
export function HomePractice({ stats, exercises, labelFor, groupTemplateId }: {
  stats: PlayerCategoryStat[]
  exercises: Exercise[]
  labelFor: (categoryId: string) => string
  groupTemplateId?: string
}) {
  const sections = practiceCategories(stats)
    .map((s) => ({ stat: s, list: homeExercisesFor(exercises, s.categoryId, groupTemplateId) }))
    .filter((s) => s.list.length > 0)
  if (sections.length === 0) return null

  return (
    <section aria-label="Practise together at home">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Practise together at home</h2>
      <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">
        A little extra time on these makes them grow fast. Try one together this week.
      </p>
      <div className="space-y-3">
        {sections.map(({ stat, list }) => (
          <div key={stat.categoryId}>
            <p className="mb-1 text-sm font-bold text-neutral-900 dark:text-neutral-50">
              💡 {labelFor(stat.categoryId)}
            </p>
            <div className="space-y-2">
              {list.map((e) => (
                <Card key={e.id} size="sm" className="px-3">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {e.emoji} {e.title} <span className="font-normal text-neutral-500">· {e.durationMinutes} min</span>
                    </summary>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{e.goal}</p>
                    {e.steps.length > 0 && (
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-neutral-700 dark:text-neutral-200">
                        {e.steps.map((step, i) => <li key={i}>{step}</li>)}
                      </ol>
                    )}
                  </details>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
