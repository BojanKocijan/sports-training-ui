import { useCountdown } from '../hooks/useCountdown'
import { Button } from './ui/button'
import { Card } from './ui/card'

/** A self-contained run/pause/reset countdown for one exercise's duration, e.g. for running it
 * live from the library. Owns its own countdown state, so a caller only needs to mount it. */
export function ExerciseTimer({ durationMinutes }: { durationMinutes: number }) {
  const { remaining, running, start, pause, reset } = useCountdown(durationMinutes * 60)
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <Card className="flex items-center justify-between rounded-xl border-0 bg-muted px-3 py-2 shadow-none hover:shadow-none [--card-spacing:0]">
      <span className="font-mono text-xl font-bold text-foreground">
        {mm}:{ss.toString().padStart(2, '0')}
      </span>
      <div className="flex gap-2">
        <Button variant="default" onClick={running ? pause : start}>
          {running ? '⏸' : '▶'}
        </Button>
        <Button variant="secondary" onClick={reset}>
          ↺
        </Button>
      </div>
    </Card>
  )
}
