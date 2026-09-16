/** Small "unlocked, tap to lock" status bar — shared across every trainer-gated screen. */
export function TrainerAccessBar({
  onLock,
  label = '✓ Trainer access unlocked',
}: {
  onLock: () => void
  label?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-neutral-900">
      <span className="text-sm font-semibold text-green-700 dark:text-green-400">{label}</span>
      <button type="button" onClick={onLock} className="text-xs font-semibold text-neutral-400">
        Lock
      </button>
    </div>
  )
}
