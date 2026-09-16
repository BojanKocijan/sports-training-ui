import { categoryInfo, type CategoryId, useCategories } from '../hooks/useCategories'
import { Chip } from './ui/chip'

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
      {cat.emoji} {cat.label}
    </Chip>
  )
}
