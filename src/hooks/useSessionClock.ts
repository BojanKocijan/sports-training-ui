import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

type SessionStatus = 'idle' | 'running' | 'paused'

interface SessionState {
  status: SessionStatus
  elapsedSeconds: number
}

interface ServerSnapshot extends SessionState {
  /** Local Date.now() when this snapshot was fetched — used to interpolate elapsed time between polls. */
  fetchedAtMs: number
}

const POLL_MS = 2000

/**
 * The session clock lives in Supabase (via sports-training-api), not just this device — every
 * trainer's phone watching the same group polls the same `/sessions/:groupId` and sees the same
 * running/paused state and elapsed time, and a start/pause/skip from any unlocked device applies
 * to everyone within a couple of seconds.
 */
export function useSessionClock(groupId: string) {
  const [snapshot, setSnapshot] = useState<ServerSnapshot>({
    status: 'idle',
    elapsedSeconds: 0,
    fetchedAtMs: Date.now(),
  })
  const [controlError, setControlError] = useState<string | null>(null)
  const [, forceTick] = useState(0)

  const applyServerState = useCallback((state: SessionState) => {
    setSnapshot({ ...state, fetchedAtMs: Date.now() })
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<SessionState>(`/sessions/${encodeURIComponent(groupId)}`)
      applyServerState(data)
    } catch {
      // API not configured / unreachable — keep showing the last known state and retry on the
      // next poll rather than flashing an error for what's often a transient blip.
    }
  }, [groupId, applyServerState])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  // Ticks the display forward once a second between polls so the clock reads smoothly instead
  // of jumping every POLL_MS — the value itself is still always derived from the server snapshot.
  useEffect(() => {
    if (snapshot.status !== 'running') return
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [snapshot.status])

  const elapsedSeconds =
    snapshot.status === 'running'
      ? snapshot.elapsedSeconds + Math.floor((Date.now() - snapshot.fetchedAtMs) / 1000)
      : snapshot.elapsedSeconds

  const runAction = useCallback(
    async (path: string, body: Record<string, unknown> = {}) => {
      setControlError(null)
      try {
        const data = await api.post<SessionState>(
          `/sessions/${encodeURIComponent(groupId)}/${path}`,
          body,
        )
        applyServerState(data)
      } catch (err) {
        setControlError(err instanceof Error ? err.message : 'Could not reach the session clock')
      }
    },
    [groupId, applyServerState],
  )

  const start = useCallback(() => runAction('start'), [runAction])
  const pause = useCallback(() => runAction('pause'), [runAction])
  const reset = useCallback(() => runAction('reset'), [runAction])
  const jumpTo = useCallback(
    (seconds: number) => runAction('seek', { seconds: Math.max(0, Math.round(seconds)) }),
    [runAction],
  )

  return {
    elapsedSeconds,
    running: snapshot.status === 'running',
    controlError,
    start,
    pause,
    reset,
    jumpTo,
  }
}
