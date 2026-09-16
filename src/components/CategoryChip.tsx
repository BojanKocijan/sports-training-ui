import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'

/** Small filter pill — used for filtering a list (e.g. the Library screen). */
export function CategoryChip({
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
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
          : 'border-black/10 bg-white text-neutral-600 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300'
      }`}
    >
      {cat.emoji} {cat.label}
    </button>
  )
}
