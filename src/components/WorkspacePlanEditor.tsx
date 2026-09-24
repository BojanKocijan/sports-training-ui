import { useState } from 'react'
import { api } from '../lib/apiClient'
import type { AdminOverview } from '../hooks/useAdminOverview'
import { Button } from './ui/button'

type Workspace = AdminOverview['workspaces'][number]

/** Platform-admin control for one workspace's package and FREE player capacity. "Unrestricted"
 * (tier null) lifts every FREE cap — used to test everything in the Basketball App workspace. */
export function WorkspacePlanEditor({ workspace, onSaved }: { workspace: Workspace; onSaved: () => void }) {
  const [tier, setTier] = useState<'free' | 'none'>(workspace.tier === 'free' ? 'free' : 'none')
  const [limit, setLimit] = useState(String(workspace.playerLimit ?? 15))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await api.patch(`/admin/workspaces/${workspace.id}`, {
        tier: tier === 'free' ? 'free' : null,
        playerLimit: Number(limit),
      })
      setSaved(true)
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the workspace')
    } finally { setBusy(false) }
  }

  const limitValid = Number.isInteger(Number(limit)) && Number(limit) >= 1

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <label className="text-sm font-medium">
        Plan
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as 'free' | 'none')}
          className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="free">Free (capped)</option>
          <option value="none">Unrestricted (no caps)</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Free player limit
        <input
          type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)}
          className="mt-1 block w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" disabled={busy || !limitValid}>{busy ? 'Saving...' : 'Save plan'}</Button>
      {saved && <span role="status" className="text-sm text-muted-foreground">Saved</span>}
      {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
      {tier === 'none' && <p className="w-full text-xs text-muted-foreground">Unrestricted lifts the group, player, sport and trainer caps for this workspace.</p>}
    </form>
  )
}
