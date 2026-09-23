import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { Chip } from './ui/chip'
import { CategoryIcon } from './CategoryIcon'

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
    <Chip selected={active} onClick={onToggle}>
      <CategoryIcon id={cat.id} fallback={cat.emoji} className="mr-1 h-3.5 w-3.5 align-[-2px]" />
      {cat.label}
    </Chip>
  )
}
