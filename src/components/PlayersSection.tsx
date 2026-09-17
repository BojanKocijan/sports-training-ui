import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import { usePlayers, type JerseyColor } from '../hooks/usePlayers'
import { usePlans } from '../hooks/usePlans'
import { CreatePlayerForm } from './CreatePlayerForm'
import { JerseyGraphic } from './JerseyGraphic'
import { PlayerDetailModal } from './PlayerDetailModal'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Skeleton } from './ui/skeleton'

/** A group's roster — add/edit/remove the kids (tracked only by nickname, never a real name)
 * training in this group. Gated behind the trainer passcode, same as plans. Editing an existing
 * player happens in place inside PlayerDetailModal (see EditPlayerForm) rather than here —
 * closing the details view to edit elsewhere read as the screen changing out from under you. */
export function PlayersSection({
  groupId,
  passcode,
}: {
  groupId: string
  passcode: () => string
}) {
  const {
    players,
    loading,
    error,
    refresh,
    createPlayer,
    updatePlayer,
    deletePlayer,
  } = usePlayers(groupId)
  const { plans } = usePlans(groupId)
  const { groups } = useGroups()

  const [adding, setAdding] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const viewingPlayer =
    players.find((player) => player.id === viewingId) ?? null

  function startAdding() {
    setSaveError(null)
    setAdding(true)
  }

  function closeForm() {
    setAdding(false)
    setSaveError(null)
  }

  async function handleCreate(
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    mascotId: string,
  ) {
    setSaving(true)
    setSaveError(null)

    try {
      await createPlayer(
        passcode(),
        nickname,
        jerseyNumber,
        jerseyColor,
        heightCm,
        weightKg,
        mascotId,
      )
      closeForm()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save player')
    } finally {
      setSaving(false)
    }
  }

  /** Passed to PlayerDetailModal as onSaveEdit — rethrows on failure so the modal knows to stay
   * in edit mode instead of exiting on a failed save (the error is already reflected via the
   * shared `saveError` state passed down alongside it). */
  async function handleEdit(
    playerId: string,
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    targetGroupId: string,
    mascotId: string | null,
  ) {
    setSaving(true)
    setSaveError(null)

    try {
      await updatePlayer(
        passcode(),
        playerId,
        targetGroupId,
        nickname,
        jerseyNumber,
        jerseyColor,
        heightCm,
        weightKg,
        mascotId,
      )
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save player')
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)

    try {
      await deletePlayer(passcode(), id)
    } catch {
      // surfaced via the shared `error` from usePlayers on next refresh
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Players
        </h2>
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-600">
          Could not load players: {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i} size="sm" className="flex flex-col items-center gap-2 px-3">
              <Skeleton className="h-56 w-40 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </Card>
          ))}
        </div>
      ) : players.length === 0 && !adding ? (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">🏀</span>

          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            No players yet
          </p>

          <p className="max-w-xs text-xs text-neutral-400">
            Add the kids in this group — nickname only — to start tracking their
            training.
          </p>

          <Button size="lg" shape="pill" className="mt-2" onClick={startAdding}>
            + Add player
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {players.map((player) => (
            <Card
              key={player.id}
              size="sm"
              className="flex flex-col items-center gap-2 px-3"
            >
              <button
                type="button"
                onClick={() => setViewingId(player.id)}
                className="flex flex-col items-center gap-2"
                aria-label={`View ${player.nickname}'s details`}
              >
                <JerseyGraphic
                  color={player.jersey_color}
                  number={player.jersey_number}
                  nickname={player.nickname}
                />

                <p className="max-w-full truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {player.nickname}
                </p>
              </button>
            </Card>
          ))}

          {!adding && (
            <button
              type="button"
              onClick={startAdding}
              aria-label="Add player"
              className="flex min-h-[13rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 text-neutral-400 transition-colors hover:border-orange-400 hover:text-orange-500 dark:border-white/15 dark:text-neutral-500 dark:hover:border-orange-400 dark:hover:text-orange-400"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current text-xl leading-none">
                +
              </span>

              <span className="text-xs font-semibold">Add player</span>
            </button>
          )}
        </div>
      )}

      {adding && (
        <div className="mt-2">
          <CreatePlayerForm
            saving={saving}
            saveError={saveError}
            onCancel={closeForm}
            onSave={handleCreate}
          />
        </div>
      )}

      {viewingPlayer && (
        <PlayerDetailModal
          player={viewingPlayer}
          plans={plans}
          groups={groups}
          passcode={passcode}
          onClose={() => setViewingId(null)}
          onRosterChange={refresh}
          onSaveEdit={(...args) => handleEdit(viewingPlayer.id, ...args)}
          saving={saving}
          saveError={saveError}
          onRemove={async () => {
            await handleRemove(viewingPlayer.id)
            setViewingId(null)
          }}
          removing={removingId === viewingPlayer.id}
        />
      )}
    </section>
  )
}
