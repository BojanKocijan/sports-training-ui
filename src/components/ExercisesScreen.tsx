import { useMemo, useState } from 'react'
import { CATEGORIES, type CategoryId } from '../data/categories'
import { exercisesForGroup } from '../data/exercises'
import { useActiveGroup } from '../hooks/useActiveGroup'
import { useGroups } from '../hooks/useGroups'
import { useRatings } from '../hooks/useRatings'
import { CategoryChip } from './CategoryChip'
import { ExerciseLibraryCard } from './ExerciseLibraryCard'

export function ExercisesScreen() {
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([])
  const { rate, stats } = useRatings()
  const { groupId } = useActiveGroup()
  const { groups } = useGroups()
  const activeGroup = groups.find((g) => g.id === groupId)
  const templateId = activeGroup?.templateId ?? groupId

  const trainable = exercisesForGroup(templateId).filter((e) => !e.isBreak)

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

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4 md:max-w-3xl lg:max-w-5xl">
      <header>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Exercise library</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {activeGroup ? `${activeGroup.name}'s exercise library. ` : 'The full exercise library. '}
          Tap one to see the steps, run its timer, or rate it.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search an exercise…"
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
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
          return (
            <ExerciseLibraryCard
              key={exercise.id}
              exercise={exercise}
              onRate={(value) => rate(exercise.id, value)}
              ratingAverage={s.average}
              ratingCount={s.count}
            />
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-400">No matches.</p>
        )}
      </div>
    </div>
  )
}
