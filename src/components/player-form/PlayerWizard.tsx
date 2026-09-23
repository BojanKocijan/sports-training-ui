import { useState } from 'react'
import { DEFAULT_MASCOT_ID, type EyeColor, type Gender, type JerseyColor } from '../../hooks/usePlayers'
import { EyeColorPicker } from './EyeColorPicker'
import { GenderPicker } from './GenderPicker'
import { JerseyColorPicker } from './JerseyColorPicker'
import { MascotPicker } from './MascotPicker'
import { toIntOrNull } from './parseNumber'
import { PlayerPreviewCard } from './PlayerPreviewCard'

const STEPS = ['nickname', 'animal', 'gender', 'jersey', 'eyes', 'details'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS: Record<Step, string> = {
  nickname: 'Nickname',
  animal: 'Animal',
  gender: 'Boy or girl?',
  jersey: 'Jersey',
  eyes: 'Eyes',
  details: 'Details',
}

export interface PlayerWizardResult {
  nickname: string
  jerseyNumber: number | null
  jerseyColor: JerseyColor | null
  heightCm: number | null
  weightKg: number | null
  mascotId: string
  eyeColor: EyeColor | null
  gender: Gender | null
  groupId: string
}

/** Full-screen, step-by-step avatar builder for adding a new player -- editing an existing
 * player stays a single flat form (EditPlayerForm) since its fields should all be visible and
 * editable at once, not walked through screen by screen. This is create-only: splits the
 * "building an avatar" choices (animal, gender, jersey color, eye color) into their own screens
 * with a live preview, then collects the record-keeping fields (nickname, number,
 * height/weight) around them, instead of dumping every field on the trainer/parent at once. */
export function PlayerWizard({
  groupId,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  /** The group this new player is added to -- "add player" is always scoped to the group
   * you're already viewing, no group picker here (see EditPlayerForm for moving a player). */
  groupId: string
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (result: PlayerWizardResult) => void
}) {
  const [step, setStep] = useState<Step>('nickname')
  const [nickname, setNickname] = useState('')
  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID)
  const [gender, setGender] = useState<Gender | null>(null)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const trimmedNickname = nickname.trim()
  const stepIndex = STEPS.indexOf(step)
  const canSave = trimmedNickname.length > 0 && !saving

  function goNext() {
    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex])
  }
  function goBack() {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) setStep(STEPS[prevIndex])
  }

  function submit() {
    if (!canSave) return
    onSave({
      nickname: trimmedNickname,
      jerseyNumber: toIntOrNull(jerseyNumber),
      jerseyColor,
      heightCm: toIntOrNull(heightCm),
      weightKg: toIntOrNull(weightKg),
      mascotId,
      eyeColor,
      gender,
      groupId,
    })
  }

  const preview = (
    <PlayerPreviewCard
      nickname={nickname}
      jerseyColor={jerseyColor}
      eyeColor={eyeColor}
      gender={gender}
      jerseyNumber={toIntOrNull(jerseyNumber)}
      groupId={groupId}
      mascotId={mascotId}
    />
  )

  const inputClass =
    'min-w-0 flex-1 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
            Cancel
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {STEP_LABELS[step]} · {stepIndex + 1}/{STEPS.length}
          </p>
        </div>

        <div className="mb-6 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          {step === 'nickname' && (
            <div className="w-full space-y-4">
              {preview}
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                autoFocus
                className={`w-full text-center text-lg ${inputClass}`}
              />
            </div>
          )}

          {step === 'animal' && (
            <div className="w-full space-y-4">
              {preview}
              <MascotPicker value={mascotId} onChange={setMascotId} />
            </div>
          )}

          {step === 'gender' && (
            <div className="w-full space-y-4">
              {preview}
              <GenderPicker value={gender} onChange={setGender} />
            </div>
          )}

          {step === 'jersey' && (
            <div className="w-full space-y-4">
              {preview}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Jersey color
                </label>
                <JerseyColorPicker value={jerseyColor} onChange={setJerseyColor} />
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="Number"
                className={`w-full text-center ${inputClass}`}
              />
            </div>
          )}

          {step === 'eyes' && (
            <div className="w-full space-y-4">
              {preview}
              <EyeColorPicker value={eyeColor} onChange={setEyeColor} />
            </div>
          )}

          {step === 'details' && (
            <div className="w-full space-y-4">
              {preview}

              {/* Optional — most groups won't bother, and a kid's height/weight change fast
               * enough that a stale value is worse than none. */}
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={50}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="Height (cm)"
                  className={inputClass}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={200}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Weight (kg)"
                  className={inputClass}
                />
              </div>

              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
            >
              Back
            </button>
          )}

          {step === 'details' ? (
            <button
              type="button"
              disabled={!canSave}
              onClick={submit}
              className="flex-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add player'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 'nickname' && trimmedNickname.length === 0}
              className="flex-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
