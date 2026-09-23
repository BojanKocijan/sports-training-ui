import {
  IconArrowsLeftRight,
  IconBallBasketball,
  IconFlame,
  IconMoodSmile,
  IconRun,
  IconShieldHalf,
  IconTargetArrow,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react'

/** Skill-category id -> sport icon. Sub-skills (e.g. `dribbling_weak_hand`) fall back to their
 * top-level category's icon via the id prefix; anything unknown keeps the emoji from the API so a
 * newly added category still renders something sensible. */
const CATEGORY_ICONS: Record<string, Icon> = {
  dribbling: IconBallBasketball,
  passing: IconArrowsLeftRight,
  shooting: IconTargetArrow,
  defense: IconShieldHalf,
  agility: IconRun,
  teamplay: IconUsersGroup,
  warmup: IconFlame,
  enjoyment: IconMoodSmile,
}

function iconFor(id: string): Icon | undefined {
  return CATEGORY_ICONS[id] ?? CATEGORY_ICONS[id.split('_')[0]]
}

export function CategoryIcon({
  id,
  fallback,
  className = 'h-4 w-4 text-orange-500',
}: {
  id: string
  /** The category's emoji from the API, shown when no icon is mapped. */
  fallback?: string
  className?: string
}) {
  const Glyph = iconFor(id)
  if (!Glyph) return fallback ? <span aria-hidden>{fallback}</span> : null
  return <Glyph aria-hidden className={`inline-block shrink-0 ${className}`} stroke={2} />
}
