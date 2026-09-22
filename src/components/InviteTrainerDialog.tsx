import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

export function InviteTrainerDialog({ open, onOpenChange, onInvite }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onInvite(email)
      setSent(true)
      setEmail('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send invitation')
    } finally { setBusy(false) }
  }

  return <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) { setError(null); setSent(false) } }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite trainer</DialogTitle>
        <DialogDescription>An email invitation grants access to the selected group. Free includes one trainer seat.</DialogDescription>
      </DialogHeader>
      {sent ? <p role="status">Invitation sent. The trainer can sign in with their email.</p> : <form onSubmit={submit}>
        <label htmlFor="invite-email" className="block text-sm font-medium">Trainer email</label>
        <input id="invite-email" type="email" autoComplete="email" required value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? 'Sending…' : 'Send invitation'}
        </button>
      </form>}
    </DialogContent>
  </Dialog>
}
