import { useState } from 'react'
import type { AdminOverview } from '../hooks/useAdminOverview'
import { api } from '../lib/apiClient'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

type Workspace = AdminOverview['workspaces'][number]

export function DeleteWorkspaceDialog({
  workspace,
  onOpenChange,
  onDeleted,
}: {
  workspace: Workspace | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => Promise<void>
}) {
  const [confirmationName, setConfirmationName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!workspace || confirmationName !== workspace.name) return

    setBusy(true)
    setError(null)
    try {
      await api.delete(`/admin/workspaces/${workspace.id}`, { confirmationName })
      await onDeleted()
      setConfirmationName('')
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete workspace')
    } finally {
      setBusy(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open && busy) return
    if (!open) {
      setConfirmationName('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={Boolean(workspace)} onOpenChange={handleOpenChange}>
      {workspace && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace?</DialogTitle>
            <DialogDescription>
              Delete this workspace from the app. Its records will remain in the database.
              Type <strong className="text-foreground">{workspace.name}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <label htmlFor="workspace-delete-confirmation" className="block text-sm font-medium">
              Workspace name
            </label>
            <input
              id="workspace-delete-confirmation"
              autoComplete="off"
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || confirmationName !== workspace.name}
              >
                {busy ? 'Deleting...' : 'Delete workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  )
}
