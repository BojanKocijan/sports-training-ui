import type { ApiGroup } from '../hooks/useGroups'
import type { LinkedChild } from '../lib/accountSession'

export interface ChildOption {
  id: string
  /** e.g. "Milo · 🏀 Basketball U8": name first, then the sport and age group. */
  label: string
}

/** One entry per linked child (a child in two sports is two entries, one per sport), so a parent
 * can tell them apart and jump straight to the right one from the avatar menu. */
export function childOptions(children: LinkedChild[], groups: ApiGroup[]): ChildOption[] {
  return children
    .map((c) => {
      const g = groups.find((group) => group.id === c.group_id)
      const where = [g?.sportName ? `${g.sportEmoji ?? '🏀'} ${g.sportName}` : g?.emoji, g?.templateLabel].filter(Boolean).join(' ')
      return { id: c.id, label: where ? `${c.nickname} · ${where}` : c.nickname }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
