import { LogOut } from 'lucide-react'
import type { AccountRole } from '../hooks/useTrainerAccess'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const ACCOUNT_ROLE_INFO: Record<AccountRole, { emoji: string; label: string }> = {
  superadmin: { emoji: '🛡️', label: 'Superadmin' },
  owner: { emoji: '👑', label: 'Owner' },
  club_admin: { emoji: '⚙️', label: 'Club admin' },
  trainer: { emoji: '🧑‍🏫', label: 'Trainer' },
  co_coach: { emoji: '🤝', label: 'Co-coach' },
}

const PARENT_INFO = { emoji: '👨‍👩‍👧', label: 'Parent' }
const ACCOUNT_FALLBACK = { emoji: '👤', label: 'Account' }

/**
 * Global account menu shown in ClubHeader.
 * Parent access is child-scoped and separate from staff account roles.
 */
export function TrainerAccessMenu({
  kind,
  accountRole,
  onLock,
}: {
  kind: 'trainer' | 'parent'
  accountRole?: AccountRole | null
  onLock: () => void
}) {
  const { emoji, label } =
    kind === 'parent'
      ? PARENT_INFO
      : accountRole
        ? ACCOUNT_ROLE_INFO[accountRole]
        : ACCOUNT_FALLBACK

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
          {emoji} {label}
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
