import { JERSEY_COLORS, type JerseyColor } from '../../hooks/usePlayers'

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

/** Picks (or clears, on re-click) the jersey color used both for the team-color swatch shown
 * here and to resolve which colored jersey artwork JerseyGraphic renders. */
export function JerseyColorPicker({
  value,
  onChange,
}: {
  value: JerseyColor | null
  onChange: (color: JerseyColor | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {JERSEY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(value === color ? null : color)}
          aria-label={color}
          className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 transition-colors ${
            value === color ? 'ring-orange-500' : 'ring-transparent'
          }`}
        >
          <JerseySwatch color={color} />
        </button>
      ))}
    </div>
  )
}
