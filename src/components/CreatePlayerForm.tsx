import { useState } from 'react'
import { DEFAULT_MASCOT_ID, type EyeColor, type JerseyColor } from '../hooks/usePlayers'
import { EyeColorPicker } from './player-form/EyeColorPicker'
import { JerseyColorPicker } from './player-form/JerseyColorPicker'
import { MascotPicker } from './player-form/MascotPicker'
import { toIntOrNull } from './player-form/parseNumber'
import { PlayerPreviewCard } from './player-form/PlayerPreviewCard'
import { Card } from './ui/card'

type Step = 'appearance' | 'details'

/** Adds a new player to the current group — no group picker, since "add player" is always
 * scoped to the group you're already viewing (see EditPlayerForm for moving an existing
 * player between groups).
 *
 * Two steps instead of one long form: "Appearance" (animal, jersey color, eye color — the
 * avatar-building choices, with a live preview) then "Details" (nickname, number, height,
 * weight — the record-keeping fields). Splitting these keeps each screen focused instead of
 * dumping every field on a young trainer/parent at once. */
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
  onSave: (
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    mascotId: string,
    eyeColor: EyeColor | null,
  ) => void
}) {
  const [step, setStep] = useState<Step>('appearance')
  const [nickname, setNickname] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID)

  const trimmed = nickname.trim()
  const canSave = trimmed.length > 0 && !saving

  function submit() {
    if (!canSave) return

    onSave(
      trimmed,
      toIntOrNull(jerseyNumber),
      jerseyColor,
      toIntOrNull(heightCm),
      toIntOrNull(weightKg),
      mascotId,
      eyeColor,
    )
  }

  if (step === 'appearance') {
    return (
      <Card size="sm" className="space-y-3 px-3">
        <PlayerPreviewCard
          nickname={nickname}
          jerseyColor={jerseyColor}
          eyeColor={eyeColor}
          jerseyNumber={toIntOrNull(jerseyNumber)}
          groupId={groupId}
          mascotId={mascotId}
        />

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

        <MascotPicker value={mascotId} onChange={setMascotId} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('details')}
            className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white"
          >
            Next
          </button>

          <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
            Cancel
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card size="sm" className="space-y-3 px-3">
      <PlayerPreviewCard
        nickname={nickname}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
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

        <button type="button" onClick={() => setStep('appearance')} className="text-xs font-semibold text-neutral-400">
          Back
        </button>

        <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
          Cancel
        </button>
      </div>
    </Card>
  )
}
