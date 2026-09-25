/** The one number a trainer scans for while planning: how long the training will run. Shown
 * big and bold in the wizard's header, on every step, not tucked into small print. */
export function TrainingMinutesBadge({ minutes, exerciseCount }: { minutes: number; exerciseCount: number }) {
  return (
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-3xl font-extrabold tabular-nums text-neutral-900 dark:text-white">{minutes}′</span>
      <span className="text-xs font-semibold text-neutral-400">
        {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
      </span>
    </div>
  )
}
