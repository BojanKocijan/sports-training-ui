import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { Card } from './ui/card'

export function LockScreen({ groupId, onSelectGroup, trainerAccess }: {
  groupId: string
  onSelectGroup: (id: string) => void
  trainerAccess: ReturnType<typeof useTrainerAccess>
}) {
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const { checking, error, tryUnlock, requestLoginCode, verifyLoginCode } = trainerAccess
  const [mode, setMode] = useState<'trainer' | 'parent'>('trainer')
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [parentCode, setParentCode] = useState('')
  const [rememberParentCode, setRememberParentCode] = useState(false)
  const activeGroup = groups.find((g) => g.id === groupId)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col items-center justify-center gap-6 px-4 py-8 md:max-w-lg">
      {groupsLoading ? <p className="text-sm text-neutral-400">Loading groups...</p>
        : groupsError ? <p className="text-sm text-red-600">Could not load groups: {groupsError}</p>
        : <div className="flex flex-wrap justify-center gap-2">
          {groups.map((g) => <button key={g.id} type="button" disabled={g.status === 'coming_soon'}
            onClick={() => onSelectGroup(g.id)}
            className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${g.id === groupId ? 'border-orange-500 text-orange-700' : 'border-black/10 text-neutral-600'} disabled:opacity-40 dark:text-neutral-300`}>
            {g.emoji} {g.name}{g.status === 'coming_soon' && ' · soon'}
          </button>)}
        </div>}
      <Card className="w-full rounded-3xl p-5 shadow-lg">
        <div className="flex gap-2" role="tablist" aria-label="Access type">
          <button type="button" role="tab" aria-selected={mode === 'trainer'} onClick={() => setMode('trainer')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'trainer' ? 'bg-orange-500 text-white' : 'text-neutral-500'}`}>
            Account
          </button>
          <button type="button" role="tab" aria-selected={mode === 'parent'} onClick={() => setMode('parent')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'parent' ? 'bg-orange-500 text-white' : 'text-neutral-500'}`}>
            Parent
          </button>
        </div>
        {mode === 'trainer' ? <form onSubmit={async (event) => {
          event.preventDefault()
          if (codeSent) await verifyLoginCode(email, emailCode)
          else if (await requestLoginCode(email)) setCodeSent(true)
        }}>
          <h1 className="mt-4 text-lg font-bold dark:text-white">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Use the email address associated with your account.</p>
          <label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email">Email</label>
          <input id="trainer-email" type="email" autoComplete="email" required value={email}
            onChange={(event) => { setEmail(event.target.value); setCodeSent(false) }}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800" />
          {codeSent && <><label className="mt-3 block text-sm dark:text-white" htmlFor="trainer-email-code">Sign-in code</label>
            <input id="trainer-email-code" type="text" inputMode="numeric" autoComplete="one-time-code" required
              value={emailCode} onChange={(event) => setEmailCode(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800" /></>}
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={checking || (codeSent && !emailCode)}
            className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {checking ? 'Please wait...' : codeSent ? 'Sign in' : 'Send sign-in code'}
          </button>
          {codeSent && <button type="button" className="mt-3 text-sm text-neutral-500 underline"
            onClick={async () => { await requestLoginCode(email) }}>Send a new code</button>}
        </form> : <form onSubmit={async (event) => { event.preventDefault(); await tryUnlock(parentCode, rememberParentCode) }}>
          <h1 className="mt-4 text-lg font-bold dark:text-white">Parent access</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Enter the child code for {activeGroup?.name ?? groupId} given by the trainer.</p>
          <label className="mt-3 block text-sm dark:text-white" htmlFor="parent-code">Parent code</label>
          <input id="parent-code" type="password" required value={parentCode}
            onChange={(event) => setParentCode(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800" />
          <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <input type="checkbox" checked={rememberParentCode} onChange={(event) => setRememberParentCode(event.target.checked)} />
            Remember this code on this device
          </label>
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={checking || !parentCode}
            className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {checking ? 'Please wait...' : 'Open parent view'}
          </button>
        </form>}
      </Card>
    </div>
  )
}
