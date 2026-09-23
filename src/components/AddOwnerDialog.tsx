import { useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function AddOwnerDialog({
  open,
  onOpenChange,
  onInvite,
}: {
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
      await onInvite(email.trim())
      setSent(true)
      setEmail('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send owner invitation')
    } finally {
      setBusy(false)
    }
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)

    if (!next) {
      setError(null)
      setSent(false)
      setEmail('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add FREE owner</DialogTitle>
          <DialogDescription>
            Invite the single owner for this FREE workspace. The owner can coach every group in
            this workspace.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <p role="status" className="text-sm text-muted-foreground">
            Owner invitation sent. They can sign in with their email.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="owner-email" className="block text-sm font-medium">
              Owner email
            </label>

            <input
              id="owner-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              FREE supports one adult account. This person becomes the workspace owner.
            </p>

            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy || !email.trim()} className="mt-4">
              {busy ? 'Sending...' : 'Send invitation'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
