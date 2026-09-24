import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { setSignInIntent, type SignInIntent } from '../lib/signInIntent'
import { Card } from './ui/card'

const inputClass = 'mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800'

/** First pick trainer or parent, then email + one-time code (or the instant sign-in link).
 * Everyone can request a code; what they can do afterwards depends on their access: trainers
 * without a workspace name one, parents without a linked child ask their trainer. */
export function SignInCard({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const { checking, error, requestSignupCode, verifySignupCode } = trainerAccess
  const [role, setRole] = useState<SignInIntent | null>(null)
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  if (!role) {
    return (
      <Card className="w-full rounded-3xl p-5 shadow-lg">
        <h2 className="text-lg font-bold dark:text-white">Sign in to CoachCub</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">How are you coming in?</p>
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={() => { setRole('trainer'); setSignInIntent('trainer') }}
            className="rounded-xl bg-orange-500 py-3 text-sm font-bold text-white">
            I'm a trainer
          </button>
          <button type="button" onClick={() => { setRole('parent'); setSignInIntent('parent') }}
            className="rounded-xl border border-orange-500 py-3 text-sm font-bold text-orange-600 dark:text-orange-300">
            I'm a parent
          </button>
        </div>
      </Card>
    )
  }

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
        {codeSent && (
          <button type="button" className="mt-3 text-sm text-neutral-500 underline"
            onClick={async () => { await requestSignupCode(email) }}>
            Send a new code
          </button>
        )}
        <button type="button" className="mt-3 block text-sm text-neutral-500 underline"
          onClick={() => { setRole(null); setCodeSent(false); setEmailCode('') }}>
          {role === 'trainer' ? "I'm a parent instead" : "I'm a trainer instead"}
        </button>
      </form>
    </Card>
  )
}
