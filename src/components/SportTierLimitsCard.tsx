import { useState } from 'react'
import { api } from '../lib/apiClient'
import { sportInfo } from '../data/sports'
import type { SportTierLimit } from '../hooks/useSportTierLimits'
import { Button } from './ui/button'

function tierLabel(tier: string) {
  if (tier === 'free') return 'Free trial'
  if (tier === 'coach') return 'Team'
  if (tier === 'club') return 'Club'
  if (tier === 'federation') return 'Federation'
  return tier
}

/** One editable sport/tier default row. Saving here changes the seat count new or
 * not-yet-overridden clubs on this sport/tier get — it does not touch any club that already
 * has its own player_limit override (see WorkspacePlanEditor), and it never retroactively
 * removes players from an already-full workspace. */
function SportTierLimitRow({ limit, onSaved }: { limit: SportTierLimit; onSaved: () => void }) {
  const [value, setValue] = useState(String(limit.maxPlayers))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await api.patch(`/admin/sport-tier-limits/${limit.sportId}/${limit.tier}`, {
        maxPlayers: Number(value),
      })
      setSaved(true)
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this limit')
    } finally { setBusy(false) }
  }

  const valid = Number.isInteger(Number(value)) && Number(value) >= 1

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-32">
        <p className="text-sm font-semibold text-foreground">{tierLabel(limit.tier)}</p>
        <p className="text-xs text-muted-foreground">Default seats per workspace</p>
      </div>
      <label className="text-sm font-medium">
        Max players
        <input
          type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)}
          aria-label={`${sportInfo(limit.sportId).label} ${tierLabel(limit.tier)} max players`}
          className="mt-1 block w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" size="sm" disabled={busy || !valid}>{busy ? 'Saving...' : 'Save'}</Button>
      {saved && <span role="status" className="text-sm text-muted-foreground">Saved</span>}
      {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
    </form>
  )
}

/** Sport-first pricing/limits admin page (sports-training-api#105): browse by sport, then edit
 * each tier's default player cap in one place — instead of hunting through individual
 * workspaces. Currently one sport (Basketball) and one enforced tier (Free); other tiers show
 * once they have real limits to configure. */
export function SportTierLimitsCard({ limits, onSaved }: { limits: SportTierLimit[]; onSaved: () => void }) {
  const bySport = new Map<string, SportTierLimit[]>()
  for (const limit of limits) {
    bySport.set(limit.sportId, [...(bySport.get(limit.sportId) ?? []), limit])
  }

  if (limits.length === 0) {
    return <p className="text-sm text-muted-foreground">No sport pricing limits configured yet.</p>
  }

  return (
    <div className="space-y-6">
      {[...bySport.entries()].map(([sportId, sportLimits]) => (
        <section key={sportId}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <span aria-hidden>{sportInfo(sportId).emoji}</span>
            {sportInfo(sportId).label}
          </h3>
          <div className="space-y-2">
            {sportLimits.map((limit) => (
              <SportTierLimitRow key={`${limit.sportId}-${limit.tier}`} limit={limit} onSaved={onSaved} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
