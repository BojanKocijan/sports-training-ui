import { useEffect } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { parentInviteMailto, parentInviteMessage } from '../utils/parentInvite'
import { Card } from './ui/card'

/** A signed-in parent whose email is not linked to a child yet: they can't do anything until
 * their child's trainer adds them, so give them ways to ask (email, copy the message or the link). */
export function ParentNoChildCard({ trainerAccess, onNotParent, notParentLabel = "I'm actually a trainer", note }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  onNotParent: () => void
  /** Label of the way out for an account that is a trainer or admin, not a parent. */
  notParentLabel?: string
  /** Extra line under the heading, e.g. saying what this account is. */
  note?: string
}) {
  const { signedInEmail, lock, refreshAccount, checking } = trainerAccess
  // One re-check when the card opens (the parent signing in again), not a poll: if the trainer
  // has added them by now they land in their view.
  useEffect(() => { void refreshAccount() }, [refreshAccount])
  const appUrl = window.location.origin
  const message = parentInviteMessage({ parentEmail: signedInEmail, appUrl })

  return (
    <Card className="w-full rounded-3xl p-8 shadow-lg">
      <h2 className="text-lg font-bold dark:text-white">No child linked to {signedInEmail} yet</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {note && <span className="mb-2 block font-semibold text-neutral-700 dark:text-neutral-200">{note}</span>}
        Your child's trainer needs to add your email. CoachCub doesn't message them for you: send them the note below
        yourself, from your own email account, WhatsApp or SMS. Then sign in again and you'll see your child's progress.
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Message to your trainer</p>
      <pre aria-label="Message to your trainer" className="mt-1 whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 font-sans text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">{message}</pre>
      <a
        href={parentInviteMailto({ trainerEmail: '', parentEmail: signedInEmail, appUrl })}
        className="mt-5 block w-full rounded-xl bg-orange-500 py-3 text-center text-base font-bold text-white"
      >
        Send email to my child's trainer
      </a>
      <button type="button" disabled={checking} onClick={() => void refreshAccount()}
        className="mt-3 w-full rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold dark:border-neutral-700 dark:text-white">
        {checking ? 'Checking...' : 'Check again'}
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">Your trainer hasn't added you yet? Come back later and check again.</p>
      <button type="button" className="mt-5 block text-sm text-neutral-500 underline" onClick={onNotParent}>
        {notParentLabel}
      </button>
      <button type="button" className="mt-2 block text-sm text-neutral-500 underline" onClick={lock}>Use a different email</button>
    </Card>
  )
}
