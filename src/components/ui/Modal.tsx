import type { ReactNode } from 'react'
import { Button } from './Button'

/** Full-screen takeover sheet — the exact shell that PrivacyPolicyScreen, PlayerDetailModal, and
 * PlanTrainingWizard each hand-rolled separately (`fixed inset-0 flex flex-col`, a header with a
 * title and a close button, safe-area top padding, a scrollable body). This is a mobile-first
 * app, so "modal" here means a full page takeover, not a centered dialog with a backdrop.
 *
 * Only PrivacyPolicyScreen is migrated onto this in the nav-shell PR (it's what ClubHeader
 * opens); PlayerDetailModal and PlanTrainingWizard migrate in their own slice so this gets
 * proven against more than one screen before other components depend on its exact API. */
// Tailwind needs the full class name literally in source to generate it — a template-literal
// `z-${n}` never matches anything, so the two z-index levels this app actually uses are spelled
// out here instead of interpolated.
const Z_INDEX = {
  30: 'z-30',
  40: 'z-40',
} as const

export function Modal({
  title,
  onClose,
  zIndex = 40,
  children,
}: {
  title: string
  onClose: () => void
  zIndex?: keyof typeof Z_INDEX
  children?: ReactNode
}) {
  return (
    <div className={`fixed inset-0 ${Z_INDEX[zIndex]} flex flex-col bg-neutral-50 dark:bg-neutral-950`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">{title}</h2>
          <Button variant="secondary" size="sm" shape="pill" onClick={onClose}>
            Close
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md">{children}</div>
      </main>
    </div>
  )
}
