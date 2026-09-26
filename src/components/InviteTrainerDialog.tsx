import { useCallback, useEffect, useState } from 'react'
import type { TrainerInvite } from '../hooks/useTrainerAccess'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { InviteStatusBadge } from './InviteStatusBadge'

export function InviteTrainerDialog({ open, onOpenChange, onInvite, onLoadInvites, onCorrectInvite, clubId, groups = [], defaultGroupId, tier = null }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string, groupIds?: string[]) => Promise<void>
  onLoadInvites?: (clubId: string) => Promise<TrainerInvite[]>
  onCorrectInvite?: (userId: string, clubId: string, email: string) => Promise<unknown>
  clubId?: string
  groups?: { id: string; name: string; status: 'available' | 'coming_soon' }[]
  defaultGroupId?: string
  /** Free workspaces include a single trainer seat, so inviting another is not possible. */
  tier?: 'free' | 'coach' | 'club' | 'federation' | null
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
  const [invites, setInvites] = useState<TrainerInvite[]>([])
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [correctedEmail, setCorrectedEmail] = useState('')

  const loadInvites = useCallback(async () => {
    if (!clubId || !onLoadInvites) return
    try {
      setInvites(await onLoadInvites(clubId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load trainer access')
    }
  }, [clubId, onLoadInvites])

  useEffect(() => {
    // Async server data belongs in the dialog once it opens; the state update happens after I/O.
    // oxlint-disable-next-line react/set-state-in-effect
    if (open) void loadInvites()
  }, [open, loadInvites])

  async function correctInvite(event: React.FormEvent, userId: string) {
    event.preventDefault()
    if (!clubId || !onCorrectInvite) return
    setBusy(true)
    setError(null)
    try {
      await onCorrectInvite(userId, clubId, correctedEmail)
      setEditingUserId(null)
      setCorrectedEmail('')
      await loadInvites()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update invitation')
    } finally { setBusy(false) }
  }

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
      {invites.length > 0 && <div className="space-y-2">
        <p className="text-sm font-medium">Trainer access</p>
        <ul className="space-y-2">
          {invites.map((invite) => <li key={invite.userId} className="rounded-lg border border-border p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{invite.email}</span>
              <span className="flex shrink-0 items-center gap-2">
                <InviteStatusBadge confirmed={invite.status === 'confirmed'} />
                {invite.status === 'pending' && onCorrectInvite && <button type="button" className="text-xs underline"
                  onClick={() => { setEditingUserId(invite.userId); setCorrectedEmail(invite.email) }}>
                  Correct email
                </button>}
              </span>
            </div>
            {editingUserId === invite.userId && <form className="mt-2 flex gap-2" onSubmit={(event) => correctInvite(event, invite.userId)}>
              <input aria-label="Correct trainer email" type="email" required value={correctedEmail}
                onChange={(event) => setCorrectedEmail(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1" />
              <button type="submit" disabled={busy} className="rounded-lg bg-orange-500 px-2 py-1 font-semibold text-white disabled:opacity-50">
                Save &amp; resend
              </button>
            </form>}
          </li>)}
        </ul>
      </div>}
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
