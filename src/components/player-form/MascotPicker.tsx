import { useMascots } from '../../hooks/useMascots'

/** The animal roster a player's mascot_id picks from (sports-training-api#43/#44). Only 'lion'
 * exists today, but the picker UI is real (not a placeholder) so it's ready as more animals
 * ship — see #68. Silently renders nothing if the roster can't be loaded or is empty, since a
 * mascot choice is optional and shouldn't block the rest of the form. */
export function MascotPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (mascotId: string) => void
}) {
  const { mascots, loading, error } = useMascots()

  if (loading || error || mascots.length === 0) return null

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Animal
      </label>
      <div className="flex flex-wrap gap-2">
        {mascots.map((mascot) => (
          <button
            key={mascot.id}
            type="button"
            onClick={() => onChange(mascot.id)}
            aria-pressed={value === mascot.id}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === mascot.id
                ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
                : 'border-black/10 text-neutral-500 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {mascot.name}
          </button>
        ))}
      </div>
    </div>
  )
}
