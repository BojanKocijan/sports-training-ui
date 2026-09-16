import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'

/** Big Airbnb-style category tile — icon over label, used for the wizard's "Focus" step. */
export function CategoryCard({
  categoryId,
  active,
  onToggle,
}: {
  categoryId: CategoryId
  active: boolean
  onToggle: () => void
}) {
  const { categories } = useCategories()
  const cat = categoryInfo(categories, categoryId)
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-colors ${
        active
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
          : 'border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900'
      }`}
    >
      <span className="text-3xl leading-none">{cat.emoji}</span>
      <span
        className={`text-sm font-semibold ${
          active ? 'text-orange-700 dark:text-orange-300' : 'text-neutral-700 dark:text-neutral-200'
        }`}
      >
        {cat.label}
      </span>
    </button>
  )
}
