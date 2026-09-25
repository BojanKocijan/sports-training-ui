import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import type { AuthMode, SignInIntent } from '../lib/signInIntent'
import { Card } from './ui/card'

const inputClass = 'mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800'
const CODE_MINUTES = 15

/** Sign up (new trainer / new parent) or log in (existing) with an email. Sign-up only sends a
 * confirmation email: the button in it signs in the tab that is waiting here (no code to type).
 * Log in sends a code, as before. An address that already has an account is told
 * to log in instead. */
export function SignInCard({ trainerAccess, role, mode, onSwitchRole, onSwitchMode }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  role: SignInIntent
  mode: AuthMode
  onSwitchRole: (next: SignInIntent) => void
  onSwitchMode: (next: AuthMode) => void
}) {
  const { checking, error, requestLoginCode, verifyLoginCode, requestSignupCode } = trainerAccess
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [exists, setExists] = useState(false)
  const signup = mode === 'signup'
  const who = role === 'trainer' ? 'trainer' : 'parent'

  const reset = () => { setCodeSent(false); setEmailCode(''); setExists(false) }

  return (
    <Card className="w-full rounded-3xl p-5 shadow-lg">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (codeSent && !signup) {
            await verifyLoginCode(email, emailCode)
          } else if (signup) {
            const result = await requestSignupCode(email)
            setCodeSent(result === 'sent')
            setExists(result === 'exists')
          } else if (await requestLoginCode(email)) {
            setCodeSent(true)
          }
        }}
      >
        <p className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
          {signup ? `New ${who}` : `Existing ${who}`}
        </p>
        <h2 className="mt-2 text-lg font-bold dark:text-white">{signup ? 'Create your account' : 'Log in'}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {signup
            ? role === 'trainer'
              ? "We'll email you a confirmation button and a code, no password needed. Then you'll set up your workspace."
              : "We'll email you a confirmation button and a code, no password needed. Then you'll link your child, or ask their trainer to."
            : "We'll email you a sign-in code, no password needed."}
        </p>
        <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email">Email</label>
        <input
          id="trainer-email" type="email" autoComplete="email" required value={email}
          onChange={(event) => { setEmail(event.target.value); reset() }}
          className={inputClass}
        />
        {codeSent && (
          <>
            <p role="status" className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-200">
              {signup
                ? `Check ${email} and tap "Confirm my email". This page signs you in as soon as you do. The link expires in ${CODE_MINUTES} minutes.`
                : `We sent a code to ${email}. It expires in ${CODE_MINUTES} minutes.`}
            </p>
          </>
        )}
        {codeSent && !signup && (
          <>
            <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email-code">Sign-in code</label>
            <input
              id="trainer-email-code" type="text" inputMode="numeric" autoComplete="one-time-code" required
              value={emailCode} onChange={(event) => setEmailCode(event.target.value)} className={inputClass}
            />
          </>
        )}
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        {exists && (
          <button type="button" className="mt-2 w-full rounded-xl border border-orange-500 py-2 text-sm font-bold text-orange-600 dark:text-orange-300"
            onClick={() => { reset(); onSwitchMode('login') }}>
            Log in instead
          </button>
        )}
        <button
          type="submit" disabled={checking || (codeSent && !signup && !emailCode)}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {checking ? 'Please wait...' : codeSent ? (signup ? 'Send the email again' : 'Log in') : signup ? 'Send confirmation email' : 'Send sign-in code'}
        </button>
        <button type="button" className="mt-3 block text-sm text-neutral-500 underline"
          onClick={() => { reset(); onSwitchMode(signup ? 'login' : 'signup') }}>
          {signup ? `I'm an existing ${who}: log in` : `I'm a new ${who}: sign up`}
        </button>
        <button type="button" className="mt-2 block text-sm text-neutral-500 underline"
          onClick={() => { reset(); onSwitchRole(role === 'trainer' ? 'parent' : 'trainer') }}>
          {role === 'trainer' ? "I'm a parent instead" : "I'm a trainer instead"}
        </button>
      </form>
    </Card>
  )
}
