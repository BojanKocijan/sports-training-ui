import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

export function InviteTrainerDialog({ open, onOpenChange, onInvite, groups = [], defaultGroupId, tier = null }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string, groupIds?: string[]) => Promise<void>
  groups?: { id: string; name: string; status: 'available' | 'coming_soon' }[]
  defaultGroupId?: string
  /** Free workspaces include a single trainer seat, so inviting another is not possible. */
  tier?: 'free' | null
}) {
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const inviteGroups = groups.filter((g) => g.status === 'available')
  const chosen = selected.length > 0 ? selected : defaultGroupId ? [defaultGroupId] : []

  function toggle(id: string) {
    setSelected((prev) => {
      const base = prev.length > 0 ? prev : defaultGroupId ? [defaultGroupId] : []
      return base.includes(id) ? base.filter((g) => g !== id) : [...base, id]
    })
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (inviteGroups.length > 0 && chosen.length === 0) {
      setError('Pick at least one group')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onInvite(email, inviteGroups.length > 0 ? chosen : undefined)
      setSent(true)
      setEmail('')
      setSelected([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send invitation')
    } finally { setBusy(false) }
  }

  return <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) { setError(null); setSent(false) } }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite trainer</DialogTitle>
        <DialogDescription>An email invitation grants access to the groups you select. {tier === 'free' && 'This workspace is on the Free plan.'}</DialogDescription>
      </DialogHeader>
      {tier === 'free' ? <div role="status" className="space-y-2 text-sm">
        <p className="font-medium">You can't invite another trainer on the Free plan.</p>
        <p className="text-muted-foreground">Free includes one trainer seat, and it is already used by this workspace's owner. Ask a platform admin to upgrade the workspace to add more trainers.</p>
      </div> : sent ? <p role="status">Invitation sent. The trainer can sign in with their email.</p> : <form onSubmit={submit}>
        <label htmlFor="invite-email" className="block text-sm font-medium">Trainer email</label>
        <input id="invite-email" type="email" autoComplete="email" required value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        {inviteGroups.length > 0 && <fieldset className="mt-4">
          <legend className="text-sm font-medium">Groups</legend>
          {inviteGroups.map((g) => <label key={g.id} className="mt-1 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={chosen.includes(g.id)} onChange={() => toggle(g.id)} />
            {g.name}
          </label>)}
        </fieldset>}
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? 'Sending...' : 'Send invitation'}
        </button>
      </form>}
    </DialogContent>
  </Dialog>
}
