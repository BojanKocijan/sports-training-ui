import { useState } from 'react'
import {
  DEFAULT_MASCOT_ID,
  EYE_COLORS,
  GENDERS,
  JERSEY_COLORS,
  type EyeColor,
  type Gender,
  type JerseyColor,
} from '../../hooks/usePlayers'
import { useMascots } from '../../hooks/useMascots'
import { mascotFaceUrl } from '../JerseyGraphic'
import { toIntOrNull } from './parseNumber'
import { PlayerPreviewCard } from './PlayerPreviewCard'
import { TileOption } from './TileOption'

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

const JERSEY_SWATCH: Record<JerseyColor, string> = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  black: 'bg-black',
  white: 'bg-white',
  yellow: 'bg-yellow-400',
}
const EYE_SWATCH: Record<EyeColor, string> = {
  blue: 'bg-[#0598EC]',
  green: 'bg-[#3CE566]',
  brown: 'bg-[#FF6F09]',
}
const GENDER_ICON: Record<Gender, string> = { boy: '🧑', girl: '👧' }

const STEPS = ['animal', 'gender', 'jersey', 'eyes', 'name'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS: Record<Step, string> = {
  animal: 'Pick an animal',
  gender: 'Boy or girl?',
  jersey: 'Jersey',
  eyes: 'Eye color',
  name: 'Name your player',
}

/** One small face-thumbnail card in the animal step's grid -- shows which animal this is via
 * the real mascot art (mascotFaceUrl's 'boy' base pose, since gender isn't picked yet) rather
 * than an emoji, which stopped scaling once the roster grew past lion/shark (#125). */
function AnimalCard({ name, mascotId, selected, onClick }: { name: string; mascotId: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-colors ${
        selected ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-transparent bg-neutral-100 dark:bg-neutral-800'
      }`}
    >
      {selected && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
          ✓
        </span>
      )}
      <div className="h-14 w-14 overflow-hidden rounded-full bg-white dark:bg-neutral-900">
        <img src={mascotFaceUrl(mascotId)} alt="" className="h-full w-full object-cover object-top" />
      </div>
      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{name}</span>
    </button>
  )
}

/** Full-screen, step-by-step avatar builder for adding a new player -- editing an existing
 * player uses SpotlightPlayerEditor's single-screen tabbed layout instead (all fields already
 * visible/editable at once suits a record that already exists; building one from scratch suits
 * being walked through it). Order: animal (face cards) -> gender -> jersey color + number, now
 * shown live on the mascot -> eye color -> name, the last step, which finishes the wizard.
 * Height/weight aren't collected here (optional bio fields, better added later via edit) -- see
 * PlayerWizardResult. */
export function CreatePlayerWizard({
  groupId,
  saving,
  saveError,
  onCancel,
  onSave,
}: {
  /** The group this new player is added to -- "add player" is always scoped to the group
   * you're already viewing, no group picker here (see SpotlightPlayerEditor for moving a
   * player once it exists). */
  groupId: string
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (result: PlayerWizardResult) => void
}) {
  const [step, setStep] = useState<Step>('animal')
  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID)
  const [gender, setGender] = useState<Gender | null>(null)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState('0')
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)
  const [nickname, setNickname] = useState('')
  const { mascots } = useMascots()

  const stepIndex = STEPS.indexOf(step)
  const canAdvance = step !== 'gender' || gender !== null
  const trimmedNickname = nickname.trim()
  const canSave = trimmedNickname.length > 0 && !saving

  function next() {
    if (!canAdvance) return
    if (step === 'name') {
      if (!canSave) return
      onSave({
        nickname: trimmedNickname,
        jerseyNumber: toIntOrNull(jerseyNumber) ?? 0,
        jerseyColor,
        heightCm: null,
        weightKg: null,
        mascotId,
        eyeColor,
        gender,
        groupId,
      })
      return
    }
    setStep(STEPS[stepIndex + 1])
  }

  function back() {
    if (stepIndex === 0) {
      onCancel()
      return
    }
    setStep(STEPS[stepIndex - 1])
  }

  // The preview only appears from the jersey step onward -- animal/gender are picked as plain
  // cards first, then the mascot "comes alive" once there's a jersey to show it wearing.
  const showPreview = step === 'jersey' || step === 'eyes' || step === 'name'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={back} className="text-xs font-semibold text-neutral-400">
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          <span className="text-xs font-semibold text-neutral-400">
            {stepIndex + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance || (step === 'name' && !canSave)}
            className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {step === 'name' ? (saving ? 'Saving…' : 'Save') : 'Next'}
          </button>
        </div>

        {saveError && <p className="mb-3 text-center text-xs font-semibold text-red-600">{saveError}</p>}

        <h2 className="mb-4 text-center text-lg font-bold text-neutral-900 dark:text-neutral-50">{STEP_LABELS[step]}</h2>

        {showPreview && (
          <div
            className="relative -mx-4 mb-4 flex h-[29rem] items-center justify-center overflow-hidden rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse 70% 55% at 50% 42%, var(--tw-gradient-stops))',
              '--tw-gradient-from': 'rgb(255 247 237)',
              '--tw-gradient-to': 'rgb(250 250 249)',
              '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
            } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute bottom-[13%] left-1/2 h-5 w-44 -translate-x-1/2 rounded-full bg-black/10 blur-sm dark:bg-black/30" />
            <div className="scale-[1.6]">
              <PlayerPreviewCard
                nickname=""
                jerseyColor={jerseyColor}
                eyeColor={eyeColor}
                gender={gender}
                jerseyNumber={toIntOrNull(jerseyNumber)}
                groupId={groupId}
                mascotId={mascotId}
                hideMeta
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          {step === 'animal' && (
            <div className="grid grid-cols-3 gap-2">
              {(mascots.length > 0 ? mascots : [{ id: DEFAULT_MASCOT_ID, name: 'Lion' }]).map((m) => (
                <AnimalCard key={m.id} name={m.name} mascotId={m.id} selected={mascotId === m.id} onClick={() => setMascotId(m.id)} />
              ))}
            </div>
          )}

          {step === 'gender' && (
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <TileOption
                  key={g}
                  label={g === 'boy' ? 'Boy' : 'Girl'}
                  icon={GENDER_ICON[g]}
                  selected={gender === g}
                  onClick={() => setGender(g)}
                />
              ))}
            </div>
          )}

          {step === 'jersey' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {JERSEY_COLORS.map((c) => (
                  <TileOption
                    key={c}
                    label={c}
                    swatchClassName={JERSEY_SWATCH[c]}
                    selected={jerseyColor === c}
                    onClick={() => setJerseyColor(jerseyColor === c ? null : c)}
                  />
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Jersey number</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50"
                />
              </div>
            </div>
          )}

          {step === 'eyes' && (
            <div className="grid grid-cols-3 gap-2">
              {EYE_COLORS.map((c) => (
                <TileOption
                  key={c}
                  label={c}
                  swatchClassName={EYE_SWATCH[c]}
                  selected={eyeColor === c}
                  onClick={() => setEyeColor(eyeColor === c ? null : c)}
                />
              ))}
            </div>
          )}

          {step === 'name' && (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              placeholder="Name your player"
              autoFocus
              className="w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-center text-lg font-bold text-neutral-900 outline-none dark:border-orange-500/40 dark:bg-neutral-900 dark:text-neutral-50"
            />
          )}
        </div>
      </div>
    </div>
  )
}
