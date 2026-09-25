import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { CategoryIcon } from './CategoryIcon'

/** Big Airbnb-style category tile — icon over label, used for the wizard's "Focus" step. A plain
 * native button, not the shadcn `Button` (its default size's `h-11 sm:h-8` only gets overridden
 * at the unprefixed breakpoint by `h-auto` — `sm:h-8` still wins at normal screen widths, so a
 * two-line icon+label tile like this one gets squashed to 32px instead of its real height). */
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
      aria-pressed={active}
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center shadow-sm transition-shadow hover:shadow-md ${
        active
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
          : 'border-border bg-card dark:bg-neutral-900'
      }`}
    >
      <CategoryIcon id={cat.id} fallback={cat.emoji} className="h-9 w-9 text-orange-500" />
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
