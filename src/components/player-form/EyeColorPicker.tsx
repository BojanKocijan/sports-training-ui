import { EYE_COLORS, type EyeColor } from '../../hooks/usePlayers'

// Matches the actual hex values baked into the eye-color mask SVGs (see JerseyGraphic.tsx /
// sports-training-api#57/#59), not a generic Tailwind shade -- these are what the swatch will
// actually render as once multiply-blended.
const SWATCH_CLASSES: Record<EyeColor, string> = {
  blue: 'bg-[#0598EC]',
  green: 'bg-[#3CE566]',
  brown: 'bg-[#FF6F09]',
}

function EyeSwatch({ color }: { color: EyeColor }) {
  return <span className={`inline-block h-3.5 w-3.5 rounded-full ${SWATCH_CLASSES[color]}`} />
}

/** Picks (or clears, on re-click) the eye color used to resolve which multiply-blended eye
 * mask JerseyGraphic renders -- same interaction pattern as JerseyColorPicker. */
export function EyeColorPicker({
  value,
  onChange,
}: {
  value: EyeColor | null
  onChange: (color: EyeColor | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EYE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(value === color ? null : color)}
          aria-label={color}
          className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 transition-colors ${
            value === color ? 'ring-orange-500' : 'ring-transparent'
          }`}
        >
          <EyeSwatch color={color} />
        </button>
      ))}
    </div>
  )
}
