import { useState } from 'react'
import type { LinkedChild } from '../lib/accountSession'
import { ParentView } from './ParentView'
import { Card } from './ui/card'

/** Landing for a signed-in parent: their linked children. One child opens straight away; several
 * (siblings, possibly in different groups) get a picker, and the parent can switch back to it. */
export function ParentHome({ linkedChildren, selectedId: controlledId, onSelect, optionLabels }: {
  linkedChildren: LinkedChild[]
  /** Controlled selection, so the avatar menu can jump straight to a child. */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Child id -> "Milo · 🏀 Basketball U8", shown in the picker so the same child in two sports is clear. */
  optionLabels?: Record<string, string>
}) {
  const [ownId, setOwnId] = useState<string | null>(null)
  const selectedId = controlledId !== undefined ? controlledId : ownId
  const setSelectedId = (id: string | null) => { if (onSelect) onSelect(id); else setOwnId(id) }
  const selected = linkedChildren.find((c) => c.id === selectedId) ?? (linkedChildren.length === 1 ? linkedChildren[0] : null)

  if (selected) {
    return (
      <>
        {linkedChildren.length > 1 && (
          <div className="mx-auto max-w-md px-4 pt-3 md:max-w-2xl">
            <button type="button" onClick={() => setSelectedId(null)}
              className="text-sm font-semibold text-orange-600 underline">
              ← All children
            </button>
          </div>
        )}
        <ParentView key={selected.id} groupId={selected.group_id} player={selected} />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 pb-24 pt-4 md:max-w-2xl">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Choose a child</h1>
      {linkedChildren.map((c) => (
        <button key={c.id} type="button" onClick={() => setSelectedId(c.id)} className="block w-full text-left">
          <Card size="sm" className="px-3">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{optionLabels?.[c.id] ?? c.nickname}</p>
          </Card>
        </button>
      ))}
    </div>
  )
}
