/** One big, tappable tile in a customization option grid (#106) -- the "big thumbnail option
 * grid" pattern, replacing a color-swatch row or a text dropdown. `swatchClassName` paints the
 * tile's own preview circle (a jersey/eye colour); pass `icon` instead for a non-colour option
 * (an animal, a gender, a backdrop). Selected state is a ring + a check badge, never colour
 * alone, so it still reads for a colour-blind trainer. */
export function TileOption({
  label,
  swatchClassName,
  icon,
  selected,
  onClick,
}: {
  label: string
  swatchClassName?: string
  icon?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 transition-colors ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
          : 'border-transparent bg-neutral-100 dark:bg-neutral-800'
      }`}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
          ✓
        </span>
      )}
      {swatchClassName ? (
        <span className={`h-9 w-9 rounded-full ring-1 ring-black/10 dark:ring-white/10 ${swatchClassName}`} />
      ) : (
        <span className="text-2xl leading-none" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{label}</span>
    </button>
  )
}
