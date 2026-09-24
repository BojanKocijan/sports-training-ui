import { ArrowLeftRight, LayoutDashboard, LogOut, Shield, UserPlus, UserRound } from 'lucide-react'
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
  onOpenParentView,
  onSwitchToTrainer,
  onAdminHome,
  onInviteTrainer,
  onOpenPrivacy,
}: {
  kind: 'trainer' | 'parent'
  accountRole?: AccountRole | null
  onLock: () => void
  /** Only for a trainer whose email is also linked to a child. */
  onOpenParentView?: () => void
  /** Only in the parent view of an account that is also a trainer. */
  onSwitchToTrainer?: () => void
  /** Superadmin only: back to the platform admin dashboard. */
  onAdminHome?: () => void
  /** Only for accounts allowed to invite trainers. */
  onInviteTrainer?: () => void
  onOpenPrivacy?: () => void
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
          size="icon"
          shape="pill"
          aria-label={`${label} account menu`}
        >
          <UserRound className="size-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {emoji} {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onAdminHome && (
          <DropdownMenuItem onClick={onAdminHome}>
            <LayoutDashboard />
            Admin dashboard
          </DropdownMenuItem>
        )}
        {onInviteTrainer && (
          <DropdownMenuItem onClick={onInviteTrainer}>
            <UserPlus />
            Invite trainer
          </DropdownMenuItem>
        )}
        {onOpenParentView && (
          <DropdownMenuItem onClick={onOpenParentView}>
            <ArrowLeftRight />
            My children (parent view)
          </DropdownMenuItem>
        )}
        {onSwitchToTrainer && (
          <DropdownMenuItem onClick={onSwitchToTrainer}>
            <ArrowLeftRight />
            Back to trainer view
          </DropdownMenuItem>
        )}
        {onOpenPrivacy && (
          <DropdownMenuItem onClick={onOpenPrivacy}>
            <Shield />
            Privacy
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLock}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
