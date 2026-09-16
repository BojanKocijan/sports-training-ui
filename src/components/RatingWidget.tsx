import { Button } from './ui/Button'
import { Card } from './ui/Card'

const SCALE = [
  { value: 1, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '🙂', label: 'Fun' },
  { value: 3, emoji: '🤩', label: 'Loved it' },
] as const

export function RatingWidget({
  onRate,
  average,
  count,
}: {
  onRate: (value: number) => void
  average: number | null
  count: number
}) {
  return (
    <Card padding="none" className="flex items-center justify-between gap-2 !bg-neutral-50 px-3 py-2 dark:!bg-neutral-800/60">
      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        Kids liked it?
      </span>
      <div className="flex items-center gap-1">
        {SCALE.map((s) => (
          <Button
            key={s.value}
            variant="ghost"
            shape="pill"
            iconOnly
            aria-label={s.label}
            onClick={() => onRate(s.value)}
            className="text-lg leading-none transition-transform active:scale-90"
          >
            {s.emoji}
          </Button>
        ))}
      </div>
      {count > 0 && average !== null && (
        <span className="shrink-0 text-xs font-medium text-neutral-400">
          avg {average.toFixed(1)} · {count}×
        </span>
      )}
    </Card>
  )
}
