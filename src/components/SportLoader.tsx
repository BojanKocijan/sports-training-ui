import { DEFAULT_SPORT_ID, sportInfo, type SportId } from '../data/sports'

/** A bouncing loading indicator keyed off the active sport's emoji instead of hardcoded to a
 * basketball — a future non-basketball group gets its own equivalent for free (see #63 and
 * sports.ts's "Generalize to any-sport" note) without this component needing to know about it. */
export function SportLoader({
  sportId = DEFAULT_SPORT_ID,
  label = 'Loading…',
}: {
  sportId?: SportId
  label?: string
}) {
  const { emoji } = sportInfo(sportId)

  return (
    <div className="flex items-center gap-2 py-2" role="status" aria-label={label}>
      <span className="animate-bounce text-xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-sm text-neutral-400">{label}</span>
    </div>
  )
}
