import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { parentInviteMailto, parentInviteMessage } from '../utils/parentInvite'
import { Card } from './ui/card'

/** A signed-in parent whose email is not linked to a child yet: they can't do anything until
 * their child's trainer adds them, so give them ways to ask (email, copy the message or the link). */
export function ParentNoChildCard({ trainerAccess, onNotParent }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  onNotParent: () => void
}) {
  const { signedInEmail, lock, refreshAccount, checking } = trainerAccess
  const [trainerEmail, setTrainerEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const appUrl = window.location.origin
  const message = parentInviteMessage({ parentEmail: signedInEmail, appUrl })

  return (
    <Card className="w-full rounded-3xl p-5 shadow-lg">
      <h2 className="text-lg font-bold dark:text-white">No child linked to {signedInEmail} yet</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Your child's trainer needs to add your email. CoachCub doesn't message them for you: send them the note below
        yourself, from your own email account, WhatsApp or SMS. Then sign in again and you'll see your child's progress.
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Message to your trainer</p>
      <pre aria-label="Message to your trainer" className="mt-1 whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 font-sans text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">{message}</pre>
      <label className="mt-3 block text-sm dark:text-white" htmlFor="parent-trainer-email">Trainer's email (optional)</label>
      <input
        id="parent-trainer-email" type="email" value={trainerEmail}
        onChange={(event) => setTrainerEmail(event.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800"
      />
      <a
        href={parentInviteMailto({ trainerEmail, parentEmail: signedInEmail, appUrl })}
        className="mt-3 block w-full rounded-xl bg-orange-500 py-2.5 text-center text-sm font-bold text-white"
      >
        Open in my email app
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {([['Copy message', message], ['Copy link', appUrl]] as const).map(([label, text]) => (
          <button
            key={label} type="button"
            className="rounded-xl border border-orange-500 py-2 text-sm font-semibold text-orange-600 dark:text-orange-300"
            onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true) } catch { /* Clipboard blocked. */ } }}
          >
            {label}
          </button>
        ))}
      </div>
      {copied && <p role="status" className="mt-2 text-xs text-neutral-500">Copied. Paste it to your trainer in any app.</p>}
      <button type="button" disabled={checking} onClick={() => void refreshAccount()}
        className="mt-3 w-full rounded-xl border border-neutral-300 py-2 text-sm font-semibold dark:border-neutral-700">
        {checking ? 'Checking...' : 'My trainer added me: check again'}
      </button>
      <button type="button" className="mt-3 block text-sm text-neutral-500 underline" onClick={onNotParent}>
        I'm actually a trainer
      </button>
      <button type="button" className="mt-2 block text-sm text-neutral-500 underline" onClick={lock}>Use a different email</button>
    </Card>
  )
}
