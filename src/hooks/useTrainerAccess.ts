import { useCallback, useEffect, useState } from 'react'
import { api, apiBaseUrl } from '../lib/apiClient'
import { currentSession, saveSession, signOut, type AccountSession } from '../lib/accountSession'
import { clearParentCredential, saveParentCredential } from '../lib/parentSession'

export interface ParentPlayer { id: string; nickname: string }
type AccessKind = 'trainer' | 'parent'
type ParentAccess = { code: string; player: ParentPlayer }

const parentKey = (groupId: string) => `sports-training-parent-${groupId}`
function storedParent(groupId: string): ParentAccess | null {
  try {
    return JSON.parse(localStorage.getItem(parentKey(groupId)) ?? 'null') as ParentAccess | null
  } catch {
    return null
  }
}

// Old group trainer codes are no longer credentials. Clear saved values from upgraded devices.
function clearLegacyCodes() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('u8-trainer-')) localStorage.removeItem(key)
    }
  } catch { /* Storage may be disabled. */ }
}

export function useTrainerAccess(groupId: string) {
  const [account, setAccount] = useState<AccountSession | null>(() => currentSession())
  const [parentOverrides, setParentOverrides] = useState<Record<string, ParentAccess | null>>({})
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    clearLegacyCodes()
    // Supabase invitation links return tokens in the URL fragment. Remove them immediately,
    // then validate the identity through our API before storing a local session.
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const invitedAccess = fragment.get('access_token')
    const invitedRefresh = fragment.get('refresh_token')
    if (invitedAccess && invitedRefresh) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      void fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${invitedAccess}` } })
        .then(async (response) => {
          if (!response.ok) throw new Error('Invitation session is not authorized')
          const me = await response.json() as { user: AccountSession['user']; groupIds: string[]; memberships: AccountSession['memberships'] }
          if (!me.user.mfaRequired && me.groupIds.length === 0) throw new Error('No trainer group was assigned')
          saveSession({
            accessToken: invitedAccess, refreshToken: invitedRefresh,
            expiresAt: Number(fragment.get('expires_at')) || Math.floor(Date.now() / 1000) + Number(fragment.get('expires_in') || 3600),
            ...me,
          })
        })
        .catch(() => { setError('Invitation could not be completed. Sign in with an email code instead.') })
    }
    const onChange = () => setAccount(currentSession())
    window.addEventListener('trainer-session-changed', onChange)
    if (currentSession()) {
      api.get<{ groupIds: string[]; memberships: AccountSession['memberships'] }>('/auth/me')
        .then(({ groupIds, memberships }) => setAccount((prev) => prev ? { ...prev, groupIds, memberships } : null))
        .catch(() => saveSession(null))
    }
    return () => window.removeEventListener('trainer-session-changed', onChange)
  }, [])

  useEffect(() => { setError(null) }, [groupId])

  const parent = parentOverrides[groupId] === undefined ? storedParent(groupId) : parentOverrides[groupId]
  const trainer = Boolean(account?.groupIds.includes(groupId))
  const state = trainer
    ? { unlocked: true, kind: 'trainer' as AccessKind, parentPlayer: null }
    : parent
      ? { unlocked: true, kind: 'parent' as AccessKind, parentPlayer: parent.player }
      : { unlocked: false, kind: null, parentPlayer: null }

  const tryUnlock = useCallback(async (code: string, remember: boolean) => {
    setChecking(true)
    setError(null)
    try {
      const result = await api.post<{ valid: boolean; player?: ParentPlayer }>('/auth/verify-parent-code', { groupId, code })
      if (!result.valid || !result.player) {
        setError('Wrong parent code, try again.')
        return false
      }
      const access = { code, player: result.player }
      saveParentCredential({ groupId, playerId: result.player.id, code }, remember)
      if (remember) localStorage.setItem(parentKey(groupId), JSON.stringify(access))
      setParentOverrides((prev) => ({ ...prev, [groupId]: access }))
      return true
    } catch {
      setError('Could not check the parent code.')
      return false
    } finally { setChecking(false) }
  }, [groupId])

  const requestLoginCode = useCallback(async (email: string) => {
    setChecking(true)
    setError(null)
    try {
      await api.post('/auth/request-code', { email })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send email code')
      return false
    } finally { setChecking(false) }
  }, [])

  const verifyLoginCode = useCallback(async (email: string, code: string) => {
    setChecking(true)
    setError(null)
    try {
      const next = await api.post<AccountSession>('/auth/verify-code', { email, code })
      saveSession(next)
      setAccount(next)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email code')
      return false
    } finally { setChecking(false) }
  }, [])

  const lock = useCallback(() => {
    if (account) {
      setAccount(null)
      void signOut(apiBaseUrl)
    } else {
      try { clearParentCredential(groupId) } catch { /* ignore */ }
      setParentOverrides((prev) => ({ ...prev, [groupId]: null }))
    }
  }, [account, groupId])

  const inviteTrainer = useCallback(async (email: string) => {
    await api.post('/auth/invite', { email, groupId, role: 'trainer' })
  }, [groupId])

  const mfaRequired = Boolean(account?.user.mfaRequired)
  const canInvite = Boolean(account?.user.superadmin || (account?.groupIds.includes(groupId) && account.memberships?.some(
    (m) => m.group_id === null && (m.role === 'owner' || m.role === 'club_admin'),
  )))

  return {
    ...state, checking, error, tryUnlock, requestLoginCode, verifyLoginCode,
    lock, inviteTrainer, canInvite, mfaRequired, groupIds: account?.groupIds ?? [],
  }
}
