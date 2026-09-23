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
import { toIntOrNull } from './parseNumber'
import type { PlayerWizardResult } from './PlayerWizard'
import { PlayerPreviewCard } from './PlayerPreviewCard'
import { CustomizationDial } from './CustomizationDial'
import { TileOption } from './TileOption'

// Duplicated from JerseyColorPicker.tsx / EyeColorPicker.tsx (module-private there) so this
// prototype doesn't touch those files -- extract to a shared module if this ships for real.
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
const MASCOT_ICON: Record<string, string> = { lion: '🦁', shark: '🦈' }

type Category = 'animal' | 'gender' | 'jersey' | 'eyes' | 'details'
const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'animal', label: 'Animal', icon: '🦁' },
  { id: 'gender', label: 'Gender', icon: '🧑' },
  { id: 'jersey', label: 'Jersey', icon: '👕' },
  { id: 'eyes', label: 'Eyes', icon: '👀' },
  { id: 'details', label: 'Details', icon: '📋' },
]

const inputClass =
  'w-full rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-500 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-50'

/** #106 -- the create-player flow (CreatePlayerForm). Replaces PlayerWizard's linear
 * nickname -> animal -> gender -> jersey -> eyes -> details steps with one screen: the avatar on
 * a "spotlight" stage, an inline-editable name, and a bottom category dial that swaps a big-tile
 * option grid below it -- the pattern from #106's references, in the app's own light/friendly
 * palette rather than their dark game-UI look. Background and ball stay inside PlayerPreviewCard
 * (they're 3D-only and already live there, #100/#110) rather than duplicated into this dial.
 * PlayerWizard.tsx is kept around unused for now, in case this needs to be reverted. */
export function SpotlightPlayerEditor({
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
  const [nickname, setNickname] = useState('')
  const [editingName, setEditingName] = useState(true) // starts in edit mode: nothing to show yet
  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID)
  const [gender, setGender] = useState<Gender | null>(null)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [category, setCategory] = useState<Category>('animal')
  const { mascots } = useMascots()

  const trimmedNickname = nickname.trim()
  const canSave = trimmedNickname.length > 0 && !saving

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-400">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {saveError && <p className="mb-3 text-center text-xs font-semibold text-red-600">{saveError}</p>}

        {editingName ? (
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => trimmedNickname && setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && trimmedNickname && setEditingName(false)}
            placeholder="Name your player"
            autoFocus
            className="mb-3 w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-center text-lg font-bold text-neutral-900 outline-none dark:border-orange-500/40 dark:bg-neutral-900 dark:text-neutral-50"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="mb-3 flex items-center justify-center gap-1.5 text-lg font-bold text-neutral-900 dark:text-neutral-50"
          >
            {trimmedNickname}
            <span className="text-sm text-neutral-400" aria-hidden="true">
              ✎
            </span>
          </button>
        )}

        {/* The "stage": a soft radial highlight behind the mascot plus a ground shadow under its
            feet, instead of the reference's dark lit pedestal -- same spotlight idea, the app's
            own light palette. `overflow-hidden` because the scaled mascot below paints outside
            its own layout box (CSS transforms don't affect layout size) -- without it, the top of
            the scaled avatar bleeds upward and paints over the name field above this stage. */}
        <div
          className="relative mb-4 flex min-h-[60vh] items-center justify-center overflow-hidden rounded-3xl"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 42%, var(--tw-gradient-stops))',
            '--tw-gradient-from': 'rgb(255 247 237)',
            '--tw-gradient-to': 'rgb(250 250 249)',
            '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
          } as React.CSSProperties}
        >
          <div className="pointer-events-none absolute bottom-[13%] left-1/2 h-5 w-44 -translate-x-1/2 rounded-full bg-black/10 blur-sm dark:bg-black/30" />
          {/* PlayerPreviewCard itself stays the shared h-72 size (it's also used compact -- roster
              cards, EditPlayerForm); scaled up here so the mascot reads as the hero of this
              screen, ~2/3 of the viewport height, without touching that shared component. */}
          <div className="scale-[1.85]">
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

        <CustomizationDial categories={CATEGORIES} active={category} onChange={setCategory} />

        <div className="mt-3 flex-1">
          {category === 'animal' && (
            <div className="grid grid-cols-3 gap-2">
              {(mascots.length > 0 ? mascots : [{ id: DEFAULT_MASCOT_ID, name: 'Lion' }]).map((m) => (
                <TileOption
                  key={m.id}
                  label={m.name}
                  icon={MASCOT_ICON[m.id] ?? '🐾'}
                  selected={mascotId === m.id}
                  onClick={() => setMascotId(m.id)}
                />
              ))}
            </div>
          )}

          {category === 'gender' && (
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

          {category === 'jersey' && (
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
          )}

          {category === 'eyes' && (
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

          {category === 'details' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Jersey number
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="e.g. 7"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
