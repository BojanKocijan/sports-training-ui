import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { suggestWorkspaceName } from '../utils/workspaceName'
import { Card } from './ui/card'

/** Email + one-time-code sign-in. Trainers sign in with their own email; a parent uses the same
 * form once a trainer has linked (and they have confirmed) their email to a child. */
export function SignInCard({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const { checking, error, requestLoginCode, verifyLoginCode, requestSignupCode, verifySignupCode } = trainerAccess
  const [signUp, setSignUp] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  return (
    <Card className="w-full rounded-3xl p-5 shadow-lg">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (signUp) {
            const name = workspaceName.trim() || suggestWorkspaceName(email)
            if (codeSent) await verifySignupCode(email, emailCode, name)
            else if (await requestSignupCode(email)) setCodeSent(true)
          } else if (codeSent) await verifyLoginCode(email, emailCode)
          else if (await requestLoginCode(email)) setCodeSent(true)
        }}
      >
        <p className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
          Trainers &amp; invited parents
        </p>
        <h2 className="mt-2 text-lg font-bold dark:text-white">{signUp ? 'Create your workspace' : 'Sign in'}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {signUp
            ? "We'll email you a code, or a button to sign in instantly. Your workspace starts on the Free plan with one basketball group."
            : "Use your email. We'll send you a sign-in code or an instant sign-in button, no password needed."}
        </p>
        <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email">Email</label>
        <input
          id="trainer-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => { setEmail(event.target.value); setCodeSent(false) }}
          className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800"
        />
        {signUp && (
          <>
            <label className="mt-3 block text-sm dark:text-white" htmlFor="signup-workspace-name">Workspace name</label>
            <input
              id="signup-workspace-name"
              type="text"
              maxLength={80}
              placeholder={email ? suggestWorkspaceName(email) : 'e.g. Bojan Kocijan Basketball'}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800"
            />
          </>
        )}
        {codeSent && (
          <>
            <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email-code">Sign-in code</label>
            <input
              id="trainer-email-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800"
            />
          </>
        )}
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={checking || (codeSent && !emailCode)}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {checking ? 'Please wait...' : codeSent ? (signUp ? 'Create workspace' : 'Sign in') : signUp ? 'Send sign-up code' : 'Send sign-in code'}
        </button>
        <button
          type="button"
          className="mt-3 block text-sm text-neutral-500 underline"
          onClick={() => { setSignUp((v) => !v); setCodeSent(false); setEmailCode('') }}
        >
          {signUp ? 'Already have an account? Sign in' : 'New here? Create a workspace'}
        </button>
        {codeSent && (
          <button
            type="button"
            className="mt-3 text-sm text-neutral-500 underline"
            onClick={async () => { await (signUp ? requestSignupCode(email) : requestLoginCode(email)) }}
          >
            Send a new code
          </button>
        )}
      </form>
    </Card>
  )
}
