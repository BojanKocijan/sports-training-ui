import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

export interface ParentPlayer {
  id: string
  nickname: string
}

type AccessKind = 'trainer' | 'parent'

interface AccessState {
  unlocked: boolean
  passcode: string
  kind: AccessKind | null
  parentPlayer: ParentPlayer | null
}

const NOT_UNLOCKED: AccessState = { unlocked: false, passcode: '', kind: null, parentPlayer: null }

const unlockedKey = (groupId: string) => `u8-trainer-unlocked-${groupId}`
const passcodeKey = (groupId: string) => `u8-trainer-passcode-${groupId}`
const kindKey = (groupId: string) => `u8-trainer-kind-${groupId}`
const parentPlayerKey = (groupId: string) => `u8-trainer-parent-player-${groupId}`

function readStoredState(groupId: string): AccessState {
  try {
    if (localStorage.getItem(unlockedKey(groupId)) !== '1') return NOT_UNLOCKED
    const kind = (localStorage.getItem(kindKey(groupId)) as AccessKind | null) ?? 'trainer'
    const parentPlayerRaw = localStorage.getItem(parentPlayerKey(groupId))
    return {
      unlocked: true,
      passcode: localStorage.getItem(passcodeKey(groupId)) ?? '',
      kind,
      parentPlayer: parentPlayerRaw ? (JSON.parse(parentPlayerRaw) as ParentPlayer) : null,
    }
  } catch {
    return NOT_UNLOCKED
  }
}

interface VerifyResult {
  valid: boolean
  kind?: AccessKind
  player?: ParentPlayer
}

/**
 * Gates the app behind a group's code — either the trainer passcode (full write access, today's
 * behavior) or a parent code scoped to one player (read-only, see sports-training-api#20). Same
 * "pick a group, enter a code" LockScreen for both; `kind`/`parentPlayer` tell the caller which
 * one it got. Each group's codes are independent, so unlock state is scoped per groupId.
 * `unlocked`/`kind`/etc. are derived straight from `(groupId, sessionOverrides)` on every
 * render — never from state that only catches up to a new groupId via an effect — so switching
 * the active group can never render a stale frame where the *previous* group's unlock briefly
 * still applies. `sessionOverrides` covers two cases plain localStorage reads can't: an unlock
 * the user chose not to remember (session-only, never written to storage) and an explicit
 * `lock()`.
 */
export function useTrainerAccess(groupId: string) {
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, AccessState>>({})
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear a stale error (e.g. "wrong code") left over from a different group's attempt.
  useEffect(() => {
    setError(null)
  }, [groupId])

  const state = sessionOverrides[groupId] ?? readStoredState(groupId)

  const tryUnlock = useCallback(
    async (code: string, remember: boolean) => {
      setChecking(true)
      setError(null)
      let result: VerifyResult
      try {
        result = await api.post<VerifyResult>('/auth/verify-passcode', {
          groupId,
          passcode: code,
        })
      } catch {
        setChecking(false)
        setError('Could not check the code — is the API set up yet?')
        return false
      }
      setChecking(false)
      if (!result.valid || !result.kind) {
        setError('Wrong code, try again.')
        return false
      }
      const parentPlayer = result.kind === 'parent' ? (result.player ?? null) : null
      try {
        if (remember) {
          localStorage.setItem(unlockedKey(groupId), '1')
          localStorage.setItem(passcodeKey(groupId), code)
          localStorage.setItem(kindKey(groupId), result.kind)
          if (parentPlayer) localStorage.setItem(parentPlayerKey(groupId), JSON.stringify(parentPlayer))
          else localStorage.removeItem(parentPlayerKey(groupId))
        } else {
          // Stay unlocked for this session only — nothing written to disk.
          localStorage.removeItem(unlockedKey(groupId))
          localStorage.removeItem(passcodeKey(groupId))
          localStorage.removeItem(kindKey(groupId))
          localStorage.removeItem(parentPlayerKey(groupId))
        }
      } catch {
        // storage unavailable; ignore
      }
      setSessionOverrides((prev) => ({
        ...prev,
        [groupId]: { unlocked: true, passcode: code, kind: result.kind ?? null, parentPlayer },
      }))
      return true
    },
    [groupId],
  )

  const lock = useCallback(() => {
    try {
      localStorage.removeItem(unlockedKey(groupId))
      localStorage.removeItem(passcodeKey(groupId))
      localStorage.removeItem(kindKey(groupId))
      localStorage.removeItem(parentPlayerKey(groupId))
    } catch {
      // storage unavailable; ignore
    }
    setSessionOverrides((prev) => ({ ...prev, [groupId]: NOT_UNLOCKED }))
  }, [groupId])

  const passcode = useCallback(() => state.passcode, [state.passcode])

  return {
    unlocked: state.unlocked,
    /** 'trainer' = today's full access; 'parent' = read-only, scoped to `parentPlayer`. */
    kind: state.kind,
    parentPlayer: state.parentPlayer,
    checking,
    error,
    tryUnlock,
    lock,
    passcode,
  }
}
