import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import {
  JERSEY_COLORS,
  usePlayers,
  type JerseyColor,
  type Player,
} from '../hooks/usePlayers'
import { usePlans } from '../hooks/usePlans'
import { JerseyGraphic } from './JerseyGraphic'
import { PlayerDetailModal } from './PlayerDetailModal'
import { Button } from './ui/button'
import { Card } from './ui/card'

// Tailwind can't see dynamically-built class names, so the swatch classes are spelled out here
// rather than interpolated from JERSEY_COLORS.
const SWATCH_CLASSES: Record<JerseyColor, string> = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  black: 'bg-black',
  white: 'bg-white border border-black/20',
  yellow: 'bg-yellow-400',
}

function JerseySwatch({ color }: { color: JerseyColor }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full ${SWATCH_CLASSES[color]}`}
    />
  )
}

function PlayerForm({
  initial,
  groups,
  showGroupPicker,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  initial: {
    nickname: string
    jerseyNumber: string
    jerseyColor: JerseyColor | null
    heightCm: string
    weightKg: string
    groupId: string
  }
  groups: {
    id: string
    name: string
    status: 'available' | 'coming_soon'
  }[]
  showGroupPicker: boolean
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    groupId: string,
  ) => void
}) {
  const [nickname, setNickname] = useState(initial.nickname)
  const [jerseyNumber, setJerseyNumber] = useState(initial.jerseyNumber)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(
    initial.jerseyColor,
  )
  const [heightCm, setHeightCm] = useState(initial.heightCm)
  const [weightKg, setWeightKg] = useState(initial.weightKg)
  const [selectedGroupId, setSelectedGroupId] = useState(initial.groupId)

  const trimmed = nickname.trim()
  const canSave = trimmed.length > 0 && selectedGroupId.length > 0 && !saving

  function toIntOrNull(value: string) {
    if (value.trim() === '') return null

    const number = Number(value)

    return Number.isFinite(number) ? number : null
  }

  function submit() {
    if (!canSave) return

    onSave(
      trimmed,
      toIntOrNull(jerseyNumber),
      jerseyColor,
      toIntOrNull(heightCm),
      toIntOrNull(weightKg),
      selectedGroupId,
    )
  }

  return (
    <Card size="sm" className="space-y-3 px-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
        />

        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          placeholder="#"
          className="w-16 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {JERSEY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setJerseyColor(jerseyColor === color ? null : color)}
            aria-label={color}
            className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 transition-colors ${
              jerseyColor === color ? 'ring-orange-500' : 'ring-transparent'
            }`}
          >
            <JerseySwatch color={color} />
          </button>
        ))}
      </div>

      {showGroupPicker && (
        <div>
          <label
            htmlFor="player-group"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400"
          >
            Group
          </label>

          <select
            id="player-group"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
          >
            {groups
              .filter((group) => group.status === 'available')
              .map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
          </select>

          <p className="mt-1 text-xs text-neutral-400">
            Moving a player keeps their individual progress history.
          </p>
        </div>
      )}

      {/* Optional — most groups won't bother, and a kid's height/weight change fast enough
       * that a stale value is worse than none. */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={50}
          max={250}
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          placeholder="Height (cm)"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
        />

        <input
          type="number"
          inputMode="numeric"
          min={10}
          max={200}
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="Weight (kg)"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
        />
      </div>

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!canSave}
          onClick={submit}
          className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-400"
        >
          Cancel
        </button>
      </div>
    </Card>
  )
}

/** A group's roster — add/edit/remove the kids (tracked only by nickname, never a real name)
 * training in this group. Gated behind the trainer passcode, same as plans. */
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const editingPlayer =
    players.find((player) => player.id === editingId) ?? null
  const viewingPlayer =
    players.find((player) => player.id === viewingId) ?? null

  function startAdding() {
    setEditingId(null)
    setAdding(true)
    setSaveError(null)
  }

  function startEditing(player: Player) {
    setAdding(false)
    setEditingId(player.id)
    setSaveError(null)
  }

  function closeForm() {
    setAdding(false)
    setEditingId(null)
    setSaveError(null)
  }

  async function handleSave(
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    targetGroupId: string,
  ) {
    setSaving(true)
    setSaveError(null)

    try {
      if (editingPlayer) {
        await updatePlayer(
          passcode(),
          editingPlayer.id,
          targetGroupId,
          nickname,
          jerseyNumber,
          jerseyColor,
          heightCm,
          weightKg,
          editingPlayer.mascot_id,
        )
      } else {
        await createPlayer(
          passcode(),
          nickname,
          jerseyNumber,
          jerseyColor,
          heightCm,
          weightKg,
        )
      }

      closeForm()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save player')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)

    try {
      await deletePlayer(passcode(), id)

      if (editingId === id) {
        closeForm()
      }
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
        <p className="text-sm text-neutral-400">Loading…</p>
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
          {players.map((player) =>
            editingId === player.id ? (
              <div key={player.id} className="col-span-full">
                <PlayerForm
                  initial={{
                    nickname: player.nickname,
                    jerseyNumber: player.jersey_number?.toString() ?? '',
                    jerseyColor: player.jersey_color,
                    heightCm: player.height_cm?.toString() ?? '',
                    weightKg: player.weight_kg?.toString() ?? '',
                    groupId: player.group_id,
                  }}
                  groups={groups}
                  showGroupPicker
                  saving={saving}
                  saveError={saveError}
                  onCancel={closeForm}
                  onSave={handleSave}
                />
              </div>
            ) : (
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
            ),
          )}

          {!adding && !editingId && (
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
          <PlayerForm
            initial={{
              nickname: '',
              jerseyNumber: '',
              jerseyColor: null,
              heightCm: '',
              weightKg: '',
              groupId,
            }}
            groups={groups}
            showGroupPicker={false}
            saving={saving}
            saveError={saveError}
            onCancel={closeForm}
            onSave={handleSave}
          />
        </div>
      )}

      {viewingPlayer && (
        <PlayerDetailModal
          player={viewingPlayer}
          plans={plans}
          passcode={passcode}
          onClose={() => setViewingId(null)}
          onRosterChange={refresh}
          onEdit={() => {
            setViewingId(null)
            startEditing(viewingPlayer)
          }}
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
