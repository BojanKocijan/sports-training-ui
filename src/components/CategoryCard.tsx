import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { Button } from './ui/button'

/** Big Airbnb-style category tile — icon over label, used for the wizard's "Focus" step. A
 * toggle button, not a `Card` (which renders a plain div) — styled with the same border/shadow
 * language as `Card` so it still reads as one of the app's "card" surfaces. */
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
    <Button
      variant="outline"
      onClick={onToggle}
      className={`h-auto flex-col gap-2 rounded-2xl border-2 px-3 py-5 text-center shadow-sm transition-shadow hover:shadow-md ${
        active
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
          : 'border-border bg-card dark:bg-neutral-900'
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
    </Button>
  )
}
