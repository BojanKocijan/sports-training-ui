import type { PlayerBadge } from '../hooks/usePlayerBadges'

/** The child's reward badges; the ones not earned yet are dimmed, not hidden, so there is
 * always something to work towards. */
export function PlayerBadges({ badges }: { badges: PlayerBadge[] }) {
  return (
    <ul aria-label="Badges" className="flex flex-wrap justify-center gap-3">
      {badges.map((b) => (
        <li
          key={b.id}
          aria-label={`${b.label}${b.earned ? '' : ' (not earned yet)'}`}
          className={`flex w-20 flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-center ${
            b.earned
              ? 'border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10'
              : 'border-black/10 bg-neutral-100 opacity-40 dark:border-white/10 dark:bg-neutral-900'
          }`}
        >
          <span className="text-xl">{b.emoji}</span>
          <span className="text-[10px] font-semibold leading-tight text-neutral-600 dark:text-neutral-300">{b.label}</span>
        </li>
      ))}
    </ul>
  )
}
