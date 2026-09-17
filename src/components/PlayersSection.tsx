import { useState } from 'react'
import { type JerseyColor, type Player, type usePlayers } from '../hooks/usePlayers'
import { CreatePlayerForm } from './CreatePlayerForm'
import { JerseyGraphic } from './JerseyGraphic'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Skeleton } from './ui/skeleton'

/** A group's roster grid — add a new kid (tracked only by nickname, never a real name), or tap an
 * existing one to open PlayerDetailScreen. That screen is a sibling top-level screen rendered by
 * App.tsx, not a modal nested in here (see #73) — this section only owns the create form and the
 * grid itself, not the player data (App.tsx owns the single `usePlayers` instance and passes it
 * down, since PlayerDetailScreen needs it too). Gated behind the trainer passcode, same as
 * plans. */
export function PlayersSection({
  passcode,
  groupId,
  players,
  loading,
  error,
  createPlayer,
  onViewPlayer,
}: {
  passcode: () => string
  groupId: string
  players: Player[]
  loading: boolean
  error: string | null
  createPlayer: ReturnType<typeof usePlayers>['createPlayer']
  onViewPlayer: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
                onClick={() => onViewPlayer(player.id)}
                className="flex flex-col items-center gap-2"
                aria-label={`View ${player.nickname}'s details`}
              >
                <JerseyGraphic
                  color={player.jersey_color}
                  number={player.jersey_number}
                  nickname={player.nickname}
                  groupId={player.group_id}
                  mascotId={player.mascot_id}
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
            groupId={groupId}
            saving={saving}
            saveError={saveError}
            onCancel={closeForm}
            onSave={handleCreate}
          />
        </div>
      )}
    </section>
  )
}
