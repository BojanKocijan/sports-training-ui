import type { MilestoneType, ProgressionMilestone } from '../hooks/usePlayerProgression'
import { Button } from './ui/button'
import { Card } from './ui/card'

const TYPE_LABEL: Record<MilestoneType, string> = {
  badge: 'Badge',
  diploma: 'Diploma',
  promotion: 'Promotion',
}

// Promotion is deliberately the loudest: it's a flag recommending the player move up a group, not
// a decoration, so it reads differently from badge/diploma even before you read the label.
const TYPE_CHIP: Record<MilestoneType, string> = {
  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  diploma: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  promotion: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
}

/** A game-style achievement path: a points readout up top, then every milestone in `sort_order`
 * as a node on a vertical timeline, styled by state (awarded/eligible/locked) and by type
 * (badge/diploma/promotion) so the sequence reads as a progression, not a flat checklist.
 *
 * `onAward` is the trainer-only action — pass it to show an "Award"/"Confirm promotion" button on
 * eligible nodes; omit it entirely for the read-only parent view (the eligible node then just
 * says it's waiting on the trainer, no button at all, matching the API's own trainer-only 403). */
export function PlayerProgressionTimeline({
  points,
  milestones,
  onAward,
  awardingId,
  awardError,
}: {
  points: number
  milestones: ProgressionMilestone[]
  onAward?: (milestoneId: string) => void
  awardingId?: string | null
  awardError?: string | null
}) {
  const nextUp = milestones.find((m) => m.state !== 'awarded')
  const priorThreshold = nextUp
    ? [...milestones]
        .filter((m) => m.sort_order < nextUp.sort_order && m.state === 'awarded')
        .reduce((max, m) => Math.max(max, m.threshold_points), 0)
    : 0
  const span = nextUp ? Math.max(nextUp.threshold_points - priorThreshold, 1) : 1
  const progressPct = nextUp ? Math.min(100, Math.max(0, ((points - priorThreshold) / span) * 100)) : 100

  return (
    <div className="space-y-4">
      <Card size="sm" className="items-center gap-1 px-3 text-center">
        <p className="text-3xl font-black text-neutral-900 dark:text-neutral-50">{points}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">points earned</p>
        {nextUp && (
          <div className="mt-2 w-full">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {Math.max(nextUp.threshold_points - points, 0)} pts to {nextUp.emoji} {nextUp.name}
            </p>
          </div>
        )}
      </Card>

      {milestones.length === 0 ? (
        <p className="text-sm text-neutral-400">No milestones set up for this sport yet.</p>
      ) : (
        <ol aria-label="Progression path" className="space-y-3">
          {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1
            const awarding = awardingId === m.id
            return (
              <li key={m.id} className="relative flex gap-3">
                {!isLast && (
                  <span
                    aria-hidden
                    className={`absolute left-5 top-11 h-[calc(100%-0.25rem)] w-0.5 -translate-x-1/2 ${
                      m.state === 'awarded' ? 'bg-orange-400' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  />
                )}
                <span
                  aria-hidden
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg ${
                    m.state === 'awarded'
                      ? 'border-transparent bg-orange-500 text-white shadow-sm'
                      : m.state === 'eligible'
                        ? 'animate-pulse border-orange-400 bg-white text-orange-600 dark:bg-neutral-900'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
                  }`}
                >
                  {m.emoji}
                </span>

                <Card
                  size="sm"
                  className={`min-w-0 flex-1 gap-1 px-3 ${m.state === 'locked' ? 'opacity-50' : ''} ${
                    m.type === 'promotion' ? 'border-violet-300 dark:border-violet-500/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`min-w-0 truncate ${
                        m.type === 'promotion' ? 'text-sm font-black' : 'text-sm font-bold'
                      } text-neutral-900 dark:text-neutral-50`}
                    >
                      {m.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_CHIP[m.type]}`}
                    >
                      {TYPE_LABEL[m.type]}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {m.threshold_points} pts
                    {m.type === 'promotion' ? ' · recommends moving up a group' : ''}
                  </p>

                  {m.state === 'awarded' && (
                    <p className="text-[11px] font-semibold text-green-600 dark:text-green-400">
                      {m.awardedAt ? `Awarded ${new Date(m.awardedAt).toLocaleDateString()}` : 'Awarded'}
                    </p>
                  )}

                  {m.state === 'eligible' &&
                    (onAward ? (
                      <Button size="sm" className="mt-1 self-start" disabled={awarding} onClick={() => onAward(m.id)}>
                        {awarding ? '...' : m.type === 'promotion' ? 'Confirm promotion' : 'Award'}
                      </Button>
                    ) : (
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                        Ready — waiting on your trainer
                      </p>
                    ))}
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      {awardError && <p className="text-sm text-red-600">{awardError}</p>}
    </div>
  )
}
