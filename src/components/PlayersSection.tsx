import { useState } from 'react'
import { JERSEY_COLORS, usePlayers, type JerseyColor, type Player } from '../hooks/usePlayers'
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
  return <span className={`inline-block h-3.5 w-3.5 rounded-full ${SWATCH_CLASSES[color]}`} />
}

function PlayerForm({
  initial,
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
  }
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
  ) => void
}) {
  const [nickname, setNickname] = useState(initial.nickname)
  const [jerseyNumber, setJerseyNumber] = useState(initial.jerseyNumber)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(initial.jerseyColor)
  const [heightCm, setHeightCm] = useState(initial.heightCm)
  const [weightKg, setWeightKg] = useState(initial.weightKg)

  const trimmed = nickname.trim()
  const canSave = trimmed.length > 0 && !saving

  function toIntOrNull(v: string) {
    if (v.trim() === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  function submit() {
    if (!canSave) return
    onSave(trimmed, toIntOrNull(jerseyNumber), jerseyColor, toIntOrNull(heightCm), toIntOrNull(weightKg))
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
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
          Cancel
        </button>
      </div>
    </Card>
  )
}

/** A group's roster — add/edit/remove the kids (tracked only by nickname, never a real name)
 * training in this group. Gated behind the trainer passcode, same as plans. */
export function PlayersSection({ groupId, passcode }: { groupId: string; passcode: () => string }) {
  const { players, loading, error, refresh, createPlayer, updatePlayer, deletePlayer } = usePlayers(groupId)
  const { plans } = usePlans(groupId)

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const editingPlayer = players.find((p) => p.id === editingId) ?? null
  const viewingPlayer = players.find((p) => p.id === viewingId) ?? null

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
  }

  async function handleSave(
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
  ) {
    setSaving(true)
    setSaveError(null)
    try {
      if (editingPlayer) {
        await updatePlayer(passcode(), editingPlayer.id, nickname, jerseyNumber, jerseyColor, heightCm, weightKg)
      } else {
        await createPlayer(passcode(), nickname, jerseyNumber, jerseyColor, heightCm, weightKg)
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
      if (editingId === id) closeForm()
    } catch {
      // surfaced via the shared `error` from usePlayers on next refresh
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Players</h2>
        {!adding && !editingId && players.length > 0 && (
          <Button variant="secondary" size="sm" onClick={startAdding}>
            + Add player
          </Button>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">Could not load players: {error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : players.length === 0 && !adding ? (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">🏀</span>
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            No players yet
          </p>
          <p className="max-w-xs text-xs text-neutral-400">
            Add the kids in this group — nickname only — to start tracking their training.
          </p>
          <Button size="lg" shape="pill" className="mt-2" onClick={startAdding}>
            + Add player
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {players.map((p) =>
            editingId === p.id ? (
              <div key={p.id} className="col-span-full">
                <PlayerForm
                  initial={{
                    nickname: p.nickname,
                    jerseyNumber: p.jersey_number?.toString() ?? '',
                    jerseyColor: p.jersey_color,
                    heightCm: p.height_cm?.toString() ?? '',
                    weightKg: p.weight_kg?.toString() ?? '',
                  }}
                  saving={saving}
                  saveError={saveError}
                  onCancel={closeForm}
                  onSave={handleSave}
                />
              </div>
            ) : (
              <Card key={p.id} size="sm" className="flex flex-col items-center gap-2 px-3">
                <button
                  type="button"
                  onClick={() => setViewingId(p.id)}
                  className="flex flex-col items-center gap-2"
                  aria-label={`View ${p.nickname}'s details`}
                >
                  <JerseyGraphic color={p.jersey_color} number={p.jersey_number} nickname={p.nickname} />
                  <p className="max-w-full truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {p.nickname}
                  </p>
                </button>
              </Card>
            ),
          )}
        </div>
      )}

      {adding && (
        <div className="mt-2">
          <PlayerForm
            initial={{ nickname: '', jerseyNumber: '', jerseyColor: null, heightCm: '', weightKg: '' }}
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
