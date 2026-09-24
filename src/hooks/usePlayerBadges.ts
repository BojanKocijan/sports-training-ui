import { useCategories } from './useCategories'
import type { PlayerCategoryStat } from './usePlayerProgress'
import { groupSkillCategories, useSkillCategories } from './useSkillCategories'

export interface PlayerBadge {
  id: string
  emoji: string
  label: string
  earned: boolean
}

/** Achievements against yourself (never a ranking against teammates), derived only from the
 * child's own ratings. Shared by the trainer's player screen and the parent's mascot tab so both
 * show the same rewards. Falls back to the older /categories taxonomy until /skill-categories is
 * live, exactly as the trainer screen did. */
export function usePlayerBadges(byCategory: PlayerCategoryStat[]): PlayerBadge[] {
  const { skillCategories } = useSkillCategories()
  const { categories } = useCategories()
  const totalCategories =
    skillCategories.length > 0
      ? groupSkillCategories(skillCategories).length
      : categories.filter((c) => c.id !== 'warmup').length
  // Only real skills count: "enjoyment" is the exercise mood rating, and a sub-skill counts as
  // its top-level category, so "Tried it all" means every top-level skill was rated.
  const skills = byCategory.filter((c) => c.categoryId !== 'enjoyment')
  const parentOf = (id: string) => skillCategories.find((c) => c.id === id)?.parentId ?? id
  const categoriesTried = new Set(skills.map((c) => parentOf(c.categoryId))).size
  const totalRatings = skills.reduce((sum, c) => sum + c.count, 0)
  const avgRating = totalRatings > 0 ? skills.reduce((sum, c) => sum + c.average * c.count, 0) / totalRatings : 0

  return [
    { id: 'tried-it-all', emoji: '🎯', label: 'Tried it all', earned: totalCategories > 0 && categoriesTried >= totalCategories },
    { id: 'consistent', emoji: '🔥', label: 'Consistent', earned: totalRatings >= 5 },
    { id: 'rising-star', emoji: '⭐', label: 'Rising star', earned: totalRatings > 0 && avgRating >= 2.5 },
  ]
}
