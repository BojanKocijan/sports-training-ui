import { LogOut } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const KIND_INFO = {
  trainer: { emoji: '🧑‍🏫', label: 'Trainer' },
  parent: { emoji: '👨‍👩‍👧', label: 'Parent' },
} as const

/** Top-right avatar + menu replacing the old inline "✓ Trainer access unlocked · Lock" bar
 * repeated on every gated screen (Groups, Players, ParentView) — shown once, globally, in
 * ClubHeader instead, same pattern as GroupMenu. */
export function TrainerAccessMenu({
  kind,
  onLock,
}: {
  kind: 'trainer' | 'parent'
  onLock: () => void
}) {
  const { emoji, label } = KIND_INFO[kind]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          shape="pill"
          aria-label={`${label} account menu`}
          className="text-base"
        >
          {emoji}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {emoji} {label} access
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLock}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
