import { CreatePlayerWizard, type PlayerWizardResult } from './player-form/CreatePlayerWizard'

/** Adds a new player to the current group via the step-by-step wizard (animal -> gender ->
 * jersey -> eyes -> name, see CreatePlayerWizard) -- no group picker, since "add player" is
 * always scoped to the group you're already viewing (see SpotlightPlayerEditor for moving an
 * existing player between groups). */
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
    <CreatePlayerWizard
      groupId={groupId}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSave={onSave}
    />
  )
}
