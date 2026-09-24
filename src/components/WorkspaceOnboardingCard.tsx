import { useState } from 'react'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { suggestWorkspaceName } from '../utils/workspaceName'
import { Card } from './ui/card'

/** Shown to a signed-in account that has no workspace yet (arrived via the emailed "Sign in
 * instantly" link): name the workspace, then land in the app. Basketball is the only sport. */
export function WorkspaceOnboardingCard({ trainerAccess, onNotTrainer }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  onNotTrainer?: () => void
}) {
  const { checking, error, createWorkspace, signedInEmail, lock } = trainerAccess
  const [name, setName] = useState(() => suggestWorkspaceName(signedInEmail))

  return (
    <Card className="w-full rounded-3xl p-5 shadow-lg">
      <form onSubmit={async (event) => { event.preventDefault(); await createWorkspace(name) }}>
        <h2 className="text-lg font-bold dark:text-white">Name your workspace</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          You're signed in as {signedInEmail}. Your workspace starts on the Free plan with one basketball group.
        </p>
        <label className="mt-3 block text-sm dark:text-white" htmlFor="workspace-name">Workspace name</label>
        <input
          id="workspace-name" type="text" required minLength={2} maxLength={80} value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-neutral-800"
        />
        <p className="mt-2 text-xs text-neutral-500">🏀 Sport: Basketball (the only sport for now)</p>
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={checking || name.trim().length < 2}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {checking ? 'Creating...' : 'Create workspace'}
        </button>
        {onNotTrainer && (
          <button type="button" className="mt-3 block text-sm text-neutral-500 underline" onClick={onNotTrainer}>I'm actually a parent</button>
        )}
        <button type="button" className="mt-2 block text-sm text-neutral-500 underline" onClick={lock}>Use a different email</button>
      </form>
    </Card>
  )
}
