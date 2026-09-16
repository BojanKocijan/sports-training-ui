import { useEffect, useRef, useState } from 'react'
import type { ApiGroup } from '../hooks/useGroups'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

/** Top-left dropdown for switching the active group — replaces what used to be a row of chips
 * repeated inline on both the Players and Groups/Training-planner screens. Shown once, globally,
 * in ClubHeader instead. Only relevant once unlocked (see App.tsx) — pre-unlock, LockScreen has
 * its own group picker for a different purpose (choosing which group's passcode to enter). */
export function GroupMenu({
  groups,
  groupId,
  setGroupId,
}: {
  groups: ApiGroup[]
  groupId: string
  setGroupId: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = groups.find((g) => g.id === groupId)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (groups.length === 0) return null

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        shape="pill"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{active?.emoji ?? '🏀'}</span>
        {active?.name ?? groupId}
        <span className="text-neutral-400">▾</span>
      </Button>

      {open && (
        <Card
          as="ul"
          padding="none"
          elevated
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 min-w-full overflow-hidden py-1"
        >
          {groups.map((g) => {
            const comingSoon = g.status === 'coming_soon'
            return (
              <li key={g.id}>
                <Button
                  variant="ghost"
                  fullWidth
                  role="option"
                  aria-selected={g.id === groupId}
                  disabled={comingSoon}
                  active={!comingSoon && g.id === groupId}
                  className={`justify-start gap-2 whitespace-nowrap rounded-none px-3 py-2 text-left ${
                    comingSoon ? '!text-neutral-400 dark:!text-neutral-600' : ''
                  }`}
                  onClick={() => {
                    setGroupId(g.id)
                    setOpen(false)
                  }}
                >
                  <span>{g.emoji}</span>
                  {g.name}
                  {comingSoon && <span className="text-[10px] font-normal">· soon</span>}
                </Button>
              </li>
            )
          })}
        </Card>
      )}
    </div>
  )
}
