import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import type { SignInIntent } from '../lib/signInIntent'
import { Card } from './ui/card'

const inputClass = 'mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800'

/** Email + one-time code (or the instant sign-in link) for the role chosen on the landing page.
 * Everyone can request a code; what they can do afterwards depends on their access: trainers
 * without a workspace name one, parents without a linked child ask their trainer. */
export function SignInCard({ trainerAccess, role, onSwitchRole }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  role: SignInIntent
  onSwitchRole: (next: SignInIntent) => void
}) {
  const { checking, error, requestSignupCode, verifySignupCode } = trainerAccess
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  return (
    <Card className="w-full rounded-3xl p-5 shadow-lg">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (codeSent) await verifySignupCode(email, emailCode)
          else if (await requestSignupCode(email)) setCodeSent(true)
        }}
      >
        <p className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
          {role === 'trainer' ? 'Trainers' : 'Parents'}
        </p>
        <h2 className="mt-2 text-lg font-bold dark:text-white">Sign in</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {role === 'trainer'
            ? "We'll email you a code or an instant sign-in button, no password needed. New here? You'll set up your workspace next."
            : "Use the email your child's trainer added. We'll email you a code or an instant sign-in button. If it isn't linked yet, we'll help you ask the trainer."}
        </p>
        <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email">Email</label>
        <input
          id="trainer-email" type="email" autoComplete="email" required value={email}
          onChange={(event) => { setEmail(event.target.value); setCodeSent(false) }}
          className={inputClass}
        />
        {codeSent && (
          <>
            <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email-code">Sign-in code</label>
            <input
              id="trainer-email-code" type="text" inputMode="numeric" autoComplete="one-time-code" required
              value={emailCode} onChange={(event) => setEmailCode(event.target.value)} className={inputClass}
            />
          </>
        )}
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit" disabled={checking || (codeSent && !emailCode)}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {checking ? 'Please wait...' : codeSent ? 'Sign in' : 'Send sign-in code'}
        </button>
        {/* Resend disabled temporarily until resend flow is fixed.
        {codeSent && (
          <>
            <button type="button" disabled={checking} className="mt-3 text-sm text-neutral-500 underline disabled:opacity-50"
              onClick={async () => { await requestSignupCode(email) }}>
              {checking ? 'Sending...' : 'Send a new code'}
            </button>
          </>
        )} */}
        <button type="button" className="mt-3 block text-sm text-neutral-500 underline"
          onClick={() => { setCodeSent(false); setEmailCode(''); onSwitchRole(role === 'trainer' ? 'parent' : 'trainer') }}>
          {role === 'trainer' ? "I'm a parent instead" : "I'm a trainer instead"}
        </button>
      </form>
    </Card>
  )
}
