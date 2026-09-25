import type { ShareStatus } from '../hooks/useExercises'

const LABELS: Record<ShareStatus, string> = {
  none: 'Private',
  pending: 'Pending review',
  approved: 'Shared with club',
  rejected: 'Not shared',
}

const CLASSES: Record<ShareStatus, string> = {
  none: 'bg-neutral-900/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
}

/** For the owner's own custom exercise only — status of its club-sharing request, if any. */
export function ShareStatusBadge({ status }: { status: ShareStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
