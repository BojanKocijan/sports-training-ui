import { useState } from 'react'
import {
  DEFAULT_MASCOT_ID,
  EYE_COLORS,
  GENDERS,
  JERSEY_COLORS,
  type EyeColor,
  type Gender,
  type JerseyColor,
  type Player,
} from '../../hooks/usePlayers'
import { useMascots } from '../../hooks/useMascots'
import { mascotFaceUrl } from '../JerseyGraphic'
import { CustomizationDial } from './CustomizationDial'
import { toIntOrNull } from './parseNumber'
import { PlayerPreviewCard } from './PlayerPreviewCard'
import { TileOption } from './TileOption'

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

/** One small face-thumbnail card in the animal category's grid -- real mascot art (the 'boy'
 * base pose) rather than an emoji, same as CreatePlayerWizard's own AnimalCard. Duplicated
 * rather than shared since the two live in different step/tab shells with different selected-
 * state chrome; extract if a third consumer shows up. */
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

/** Edits an existing player, pre-filled from `player` -- rendered in place inside
 * PlayerDetailScreen (Edit no longer closes the details view/jumps to the roster grid). This
 * used to be the create-player flow (#106); create now uses CreatePlayerWizard's step-by-step
 * screens instead, since building a brand-new player suits being walked through it one choice
 * at a time, while editing an existing one should show every field at once, already filled in,
 * on the same avatar-forward layout (still image/tile-grid style) rather than a plain stacked
 * form. Also carries the group picker (in the Details tab), since moving a player only makes
 * sense once they already exist. */
export function SpotlightPlayerEditor({
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
  const [editingName, setEditingName] = useState(false)
  const [mascotId, setMascotId] = useState(player.mascot_id ?? DEFAULT_MASCOT_ID)
  const [gender, setGender] = useState<Gender | null>(player.gender)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(player.jersey_color)
  const [jerseyNumber, setJerseyNumber] = useState(player.jersey_number?.toString() ?? '')
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(player.eye_color)
  const [heightCm, setHeightCm] = useState(player.height_cm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(player.weight_kg?.toString() ?? '')
  const [groupId, setGroupId] = useState(player.group_id)
  const [category, setCategory] = useState<Category>('animal')
  const { mascots } = useMascots()

  const trimmedNickname = nickname.trim()
  const canSave = trimmedNickname.length > 0 && groupId.length > 0 && !saving

  function submit() {
    if (!canSave) return
    onSave(
      trimmedNickname,
      toIntOrNull(jerseyNumber) ?? 0,
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
            feet. `-mx-4` bleeds the stage past this screen's own `px-4` so the scaled avatar
            gets the full viewport width to work with, not viewport-minus-2rem. Height is a fixed
            rem, not a `vh` value -- a viewport-relative height could end up shorter than the
            scaled content on a short/landscape screen, silently clipping the mascot's top instead
            of ever shrinking it. 36rem (not CreatePlayerWizard's 29rem) because this card shows
            its still/3D toggle + ball/backdrop controls (unlike the wizard's `hideMeta`), and
            those rows get scaled up right along with the image inside the same `scale-[1.6]`
            div -- needs headroom for them or their top edge clips too. Keep in sync with the
            scale factor below if either changes. */}
        <div
          className="relative -mx-4 mb-4 flex h-[36rem] items-center justify-center overflow-hidden rounded-3xl"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 42%, var(--tw-gradient-stops))',
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
              hideCaption
            />
          </div>
        </div>

        <CustomizationDial categories={CATEGORIES} active={category} onChange={setCategory} />

        <div className="mt-3 flex-1">
          {category === 'animal' && (
            <div className="grid grid-cols-3 gap-3">
              {(mascots.length > 0 ? mascots : [{ id: DEFAULT_MASCOT_ID, name: 'Lion' }]).map((m) => (
                <AnimalCard key={m.id} name={m.name} mascotId={m.id} selected={mascotId === m.id} onClick={() => setMascotId(m.id)} />
              ))}
            </div>
          )}

          {category === 'gender' && (
            <div className="grid grid-cols-3 gap-3">
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
            <div className="grid grid-cols-3 gap-3">
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
            <div className="grid grid-cols-3 gap-3">
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
                  className={`${inputClass} disabled:opacity-50`}
                >
                  {groups
                    .filter((group) => group.status === 'available')
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-neutral-400">Moving a player keeps their individual progress history.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
