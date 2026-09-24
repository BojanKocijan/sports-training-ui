import type { ApiGroup } from '../hooks/useGroups'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

/** Top-left dropdown for switching the active group — replaces what used to be a row of chips
 * repeated inline on both the Players and Groups/Training-planner screens. Shown once, globally,
 * in ClubHeader instead. Only relevant once unlocked (see App.tsx) — pre-unlock, LockScreen has
 * its own group picker for a different purpose (choosing which group to enter).
 *
 * Built on shadcn/Radix's DropdownMenu (as a RadioGroup, since exactly one group is ever
 * "active") for arrow-key navigation, correct menuitemradio/aria-checked semantics, and
 * focus-return to the trigger on close — the hand-rolled click-outside/Escape useEffect this
 * replaced only covered two of those. */
export function GroupMenu({
  groups,
  groupId,
  setGroupId,
}: {
  groups: ApiGroup[]
  groupId: string
  setGroupId: (id: string) => void
}) {
  const active = groups.find((g) => g.id === groupId)

  if (groups.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" shape="pill">
          <span>{active?.emoji ?? '🏀'}</span>
          {active?.name ?? groupId}
          <span className="text-muted-foreground">▾</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
        {/* Basketball is the only sport available today; other sports are coming later. */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          🏀 Basketball · the only sport for now
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={groupId} onValueChange={setGroupId}>
          {groups.map((g) => {
            const comingSoon = g.status === 'coming_soon'
            return (
              <DropdownMenuRadioItem key={g.id} value={g.id} disabled={comingSoon}>
                <span>{g.emoji}</span>
                {g.name}
                {comingSoon && <span className="text-[10px] font-normal">· soon</span>}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
