import { Button } from './ui/button'
import { Card } from './ui/card'

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
    <Card className="flex items-center justify-between gap-2 rounded-xl border-0 bg-muted px-3 py-2 shadow-none hover:shadow-none [--card-spacing:0]">
      <span className="text-xs font-semibold text-muted-foreground">Kids liked it?</span>
      <div className="flex items-center gap-1">
        {SCALE.map((s) => (
          <Button
            key={s.value}
            variant="ghost"
            shape="pill"
            size="icon-sm"
            aria-label={s.label}
            onClick={() => onRate(s.value)}
            className="text-lg leading-none transition-transform active:scale-90"
          >
            {s.emoji}
          </Button>
        ))}
      </div>
      {count > 0 && average !== null && (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          avg {average.toFixed(1)} · {count}×
        </span>
      )}
    </Card>
  )
}
