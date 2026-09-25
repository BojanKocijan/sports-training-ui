import type { Category, CategoryId } from '../hooks/useCategories'
import { CategoryCard } from './CategoryCard'

export function TrainingFocusStep({
  categories,
  activeCategories,
  onToggle,
}: {
  categories: Category[]
  activeCategories: CategoryId[]
  onToggle: (id: CategoryId) => void
}) {
  return (
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
            onToggle={() => onToggle(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}
