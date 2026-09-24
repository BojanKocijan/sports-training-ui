import { useCallback, useEffect, useState } from 'react'
import { api, apiBaseUrl } from '../lib/apiClient'
import { currentSession, saveSession, signOut, type AccountSession } from '../lib/accountSession'
import type { EyeColor, Gender, JerseyColor } from './usePlayers'

/** A child shown in the parent view. Appearance fields are optional so the view can also render
 * from just id + nickname, falling back to the default mascot. */
export interface ParentPlayer {
  id: string
  nickname: string
  group_id?: string
  jersey_number?: number | null
  jersey_color?: JerseyColor | null
  eye_color?: EyeColor | null
  gender?: Gender | null
  mascot_id?: string | null
}
export type AccountRole = 'superadmin' | 'owner' | 'club_admin' | 'trainer' | 'co_coach'
type AccessKind = 'trainer' | 'parent'

// Old trainer passcodes and parent codes are no longer credentials. Clear saved values from
// upgraded devices.
function clearLegacyCodes() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('u8-trainer-') || key.startsWith('sports-training-parent-')) localStorage.removeItem(key)
    }
  } catch { /* Storage may be disabled. */ }
}

export function useTrainerAccess(groupId: string) {
  const [account, setAccount] = useState<AccountSession | null>(() => currentSession())
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
          const me = await response.json() as { user: AccountSession['user']; groupIds: string[]; memberships: AccountSession['memberships']; children?: AccountSession['children'] }
          // No group or child yet is fine: a brand-new sign-up names its workspace next
          // (see needsWorkspace / createWorkspace).
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
      api.get<{ groupIds: string[]; memberships: AccountSession['memberships']; children?: AccountSession['children'] }>('/auth/me')
        .then(({ groupIds, memberships, children }) => setAccount((prev) => prev ? { ...prev, groupIds, memberships, children } : null))
        .catch(() => saveSession(null))
    }
    return () => window.removeEventListener('trainer-session-changed', onChange)
  }, [])

  useEffect(() => { setError(null) }, [groupId])

  const trainer = Boolean(account?.groupIds.includes(groupId))
  // A parent's account has no group access of its own: it is linked to specific children, who may
  // sit in different groups, so parent access is not tied to the selected group.
  const linkedChildren = account?.children ?? []
  // Independent of trainer access: an account can be both a trainer and a parent.
  const isParent = Boolean(account && !account.user.superadmin && linkedChildren.length > 0)
  // Signed in (e.g. via the emailed "Sign in instantly" link) but not yet in any workspace.
  const needsWorkspace = Boolean(
    account && !account.user.superadmin && account.groupIds.length === 0 && linkedChildren.length === 0,
  )
  const state = trainer
    ? { unlocked: true, kind: 'trainer' as AccessKind }
    : isParent
      ? { unlocked: true, kind: 'parent' as AccessKind }
      : { unlocked: false, kind: null }

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

  const requestSignupCode = useCallback(async (email: string) => {
    setChecking(true)
    setError(null)
    try {
      await api.post('/auth/signup/request', { email })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send sign-up code')
      return false
    } finally { setChecking(false) }
  }, [])

  const verifySignupCode = useCallback(async (email: string, code: string) => {
    setChecking(true)
    setError(null)
    try {
      const next = await api.post<AccountSession>('/auth/signup/verify', { email, code })
      saveSession(next)
      setAccount(next)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid sign-up code')
      return false
    } finally { setChecking(false) }
  }, [])

  // Re-read access, e.g. a parent checking whether their trainer has linked their child yet.
  const refreshAccount = useCallback(async () => {
    setChecking(true)
    setError(null)
    try {
      const me = await api.get<Pick<AccountSession, 'groupIds' | 'memberships' | 'children'>>('/auth/me')
      const current = currentSession()
      if (current) {
        const next = { ...current, ...me }
        saveSession(next)
        setAccount(next)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check your access')
    } finally { setChecking(false) }
  }, [])

  const createWorkspace = useCallback(async (workspaceName: string) => {
    setChecking(true)
    setError(null)
    try {
      await api.post('/auth/workspace', { workspaceName })
      const me = await api.get<Pick<AccountSession, 'groupIds' | 'memberships' | 'children'>>('/auth/me')
      const current = currentSession()
      if (current) {
        const next = { ...current, ...me }
        saveSession(next)
        setAccount(next)
      }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the workspace')
      return false
    } finally { setChecking(false) }
  }, [])

  const lock = useCallback(() => {
    if (account) {
      setAccount(null)
      void signOut(apiBaseUrl)
    }
  }, [account])

  const inviteTrainer = useCallback(async (email: string, groupIds?: string[]) => {
    const body = groupIds && groupIds.length > 0 ? { groupIds } : { groupId }
    await api.post('/auth/invite', { email, ...body, role: 'trainer' })
  }, [groupId])

  const inviteOwnerForGroup = useCallback(async (
    email: string,
    targetGroupId: string,
  ) => {
    await api.post('/auth/invite', {
      email,
      groupId: targetGroupId,
      role: 'owner',
    })
  }, [])

  const inviteOwner = useCallback(async (email: string) => {
    await inviteOwnerForGroup(email, groupId)
  }, [groupId, inviteOwnerForGroup])

  const isSuperadmin = Boolean(account?.user.superadmin)

  const clubRole = account?.memberships.find((m) => m.group_id === null)?.role
  const groupRole = account?.memberships.find((m) => m.group_id === groupId)?.role
  const membershipRole = clubRole ?? groupRole

  const accountRole: AccountRole | null = account?.user.superadmin
    ? 'superadmin'
    : membershipRole === 'owner' ||
        membershipRole === 'club_admin' ||
        membershipRole === 'trainer' ||
        membershipRole === 'co_coach'
      ? membershipRole
      : null
  const canInvite = Boolean(account?.user.superadmin || (account?.groupIds.includes(groupId) && account.memberships?.some(
    (m) => m.group_id === null && (m.role === 'owner' || m.role === 'club_admin'),
  )))

  return {
    ...state, checking, error, requestLoginCode, verifyLoginCode,
    needsWorkspace, requestSignupCode, verifySignupCode, createWorkspace, refreshAccount,
    signedInEmail: account?.user.email ?? '',
    lock, inviteTrainer, inviteOwner, inviteOwnerForGroup,
    canInvite, isSuperadmin, accountRole,
    groupIds: account?.groupIds ?? [],
    children: linkedChildren,
  }
}
