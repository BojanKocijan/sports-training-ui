import { useState } from 'react'
import { DEFAULT_MASCOT_ID, type EyeColor, type Gender, type JerseyColor, type Player } from '../hooks/usePlayers'
import { EyeColorPicker } from './player-form/EyeColorPicker'
import { GenderPicker } from './player-form/GenderPicker'
import { JerseyColorPicker } from './player-form/JerseyColorPicker'
import { MascotPicker } from './player-form/MascotPicker'
import { toIntOrNull } from './player-form/parseNumber'
import { PlayerPreviewCard } from './player-form/PlayerPreviewCard'
import { Card } from './ui/card'

/** Edits an existing player, pre-filled from `player` — rendered in place inside
 * PlayerDetailScreen (Edit no longer closes the details view/jumps to the roster grid).
 * Unlike CreatePlayerForm's step-by-step wizard, editing stays a single flat form — an
 * existing player's fields should all be visible and editable at once, not walked through
 * screen by screen. Also shows the group picker, since moving a player only makes sense once
 * they already exist. */
export function EditPlayerForm({
  player,
  groups,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  player: Player
  groups: { id: string; name: string; status: 'available' | 'coming_soon' }[]
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
    mascotId: string | null,
    eyeColor: EyeColor | null,
    gender: Gender | null,
  ) => void
}) {
  const [nickname, setNickname] = useState(player.nickname)
  const [jerseyNumber, setJerseyNumber] = useState(player.jersey_number?.toString() ?? '')
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(player.jersey_color)
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(player.eye_color)
  const [gender, setGender] = useState<Gender | null>(player.gender)
  const [heightCm, setHeightCm] = useState(player.height_cm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(player.weight_kg?.toString() ?? '')
  const [groupId, setGroupId] = useState(player.group_id)
  const [mascotId, setMascotId] = useState(player.mascot_id ?? DEFAULT_MASCOT_ID)

  const trimmed = nickname.trim()
  const canSave = trimmed.length > 0 && groupId.length > 0 && !saving

  function submit() {
    if (!canSave) return

    onSave(
      trimmed,
      toIntOrNull(jerseyNumber),
      jerseyColor,
      toIntOrNull(heightCm),
      toIntOrNull(weightKg),
      groupId,
      mascotId,
      eyeColor,
      gender,
    )
  }

  return (
    <Card size="sm" className="space-y-3 px-3">
      <PlayerPreviewCard
        nickname={nickname}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
        gender={gender}
        jerseyNumber={toIntOrNull(jerseyNumber)}
        groupId={groupId}
        mascotId={mascotId}
      />

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

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Jersey color
        </label>
        <JerseyColorPicker value={jerseyColor} onChange={setJerseyColor} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Eye color
        </label>
        <EyeColorPicker value={eyeColor} onChange={setEyeColor} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Boy or girl?
        </label>
        <GenderPicker value={gender} onChange={setGender} />
      </div>

      <MascotPicker value={mascotId} onChange={setMascotId} />

      <div>
        <label
          htmlFor="edit-player-group"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400"
        >
          Group
        </label>

        <select
          id="edit-player-group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
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
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
          Cancel
        </button>
      </div>
    </Card>
  )
}
