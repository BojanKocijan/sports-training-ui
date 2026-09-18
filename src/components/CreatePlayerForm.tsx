import { PlayerWizard, type PlayerWizardResult } from './player-form/PlayerWizard'

/** Adds a new player to the current group via the full-screen step-by-step wizard — no group
 * picker, since "add player" is always scoped to the group you're already viewing (see
 * EditPlayerForm for moving an existing player between groups). */
export function CreatePlayerForm({
  groupId,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  groupId: string
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (result: PlayerWizardResult) => void
}) {
  return (
    <PlayerWizard
      groupId={groupId}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSave={onSave}
    />
  )
}
