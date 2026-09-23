import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { CategoryIcon } from './CategoryIcon'

export function CategoryBadges({ categories }: { categories: CategoryId[] }) {
  const { categories: allCategories } = useCategories()
  if (categories.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((id) => {
        const info = categoryInfo(allCategories, id)
        return (
          <span
            key={id}
            className="rounded-full bg-neutral-900/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
          >
            <CategoryIcon id={id} fallback={info.emoji} className="mr-1 h-3 w-3 align-[-2px]" />
            {info.label}
          </span>
        )
      })}
    </div>
  )
}
