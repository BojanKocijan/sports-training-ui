import { GENDERS, type Gender } from '../../hooks/usePlayers'

const LABELS: Record<Gender, string> = {
  boy: 'Boy',
  girl: 'Girl',
}

/** Picks which of the 2 dynamic base poses (leon-baby-boy.webp / leon-baby-girl.webp) the
 * player's avatar uses -- see JerseyGraphic.tsx and sports-training-api#57/#59. Two big buttons
 * rather than a color-swatch row (JerseyColorPicker/EyeColorPicker's pattern) since there's
 * nothing to swatch here, just a binary pick. */
export function GenderPicker({
  value,
  onChange,
}: {
  value: Gender | null
  onChange: (gender: Gender) => void
}) {
  return (
    <div className="flex gap-3">
      {GENDERS.map((gender) => (
        <button
          key={gender}
          type="button"
          onClick={() => onChange(gender)}
          aria-pressed={value === gender}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
            value === gender
              ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
              : 'border-black/10 text-neutral-500 dark:border-white/10 dark:text-neutral-400'
          }`}
        >
          {LABELS[gender]}
        </button>
      ))}
    </div>
  )
}
