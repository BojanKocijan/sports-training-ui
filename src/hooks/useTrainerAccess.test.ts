import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { saveSession, type AccountSession } from '../lib/accountSession'
import { useTrainerAccess } from './useTrainerAccess'

vi.mock('../lib/apiClient', () => ({ api: { post: vi.fn(), get: vi.fn(), put: vi.fn() }, apiBaseUrl: 'http://localhost:3002' }))
const postMock = vi.mocked(api.post)
const getMock = vi.mocked(api.get)
const putMock = vi.mocked(api.put)
const session: AccountSession = {
  accessToken: 'jwt', refreshToken: 'refresh', expiresAt: 9999999999,
  user: { id: 'trainer-1', email: 'trainer@example.com', superadmin: false },
  groupIds: ['u8'], memberships: [{ club_id: 'club-1', group_id: 'u8', role: 'trainer', active: true }],
}

beforeEach(() => {
  saveSession(null)
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  getMock.mockResolvedValue({ groupIds: ['u8'], memberships: session.memberships })
})

describe('useTrainerAccess', () => {
  it('requests email OTP and unlocks only assigned groups after verification', async () => {
    postMock.mockResolvedValueOnce({}).mockResolvedValueOnce(session)
    const { result, rerender } = renderHook(({ groupId }) => useTrainerAccess(groupId), { initialProps: { groupId: 'u8' } })
    await act(async () => {
      expect(await result.current.requestLoginCode('trainer@example.com')).toBe(true)
      expect(await result.current.verifyLoginCode('trainer@example.com', '123456')).toBe(true)
    })
    expect(postMock).toHaveBeenNthCalledWith(1, '/auth/request-code', { email: 'trainer@example.com' })
    expect(postMock).toHaveBeenNthCalledWith(2, '/auth/verify-code', { email: 'trainer@example.com', code: '123456' })
    expect(result.current.unlocked).toBe(true)
    expect(result.current.kind).toBe('trainer')
    expect(localStorage.getItem('sports-training-account-session')).toContain('jwt')
    expect(localStorage.getItem('u8-trainer-passcode-u8')).toBeNull()
    rerender({ groupId: 'u10' })
    expect(result.current.unlocked).toBe(false)
  })

  it('rejects a bad email code without unlocking', async () => {
    postMock.mockRejectedValueOnce(new Error('Invalid or expired sign-in code'))
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await act(async () => { expect(await result.current.verifyLoginCode('trainer@example.com', '000000')).toBe(false) })
    expect(result.current.unlocked).toBe(false)
    expect(result.current.error).toBe('Invalid or expired sign-in code')
  })

  it('signs a parent in by email and unlocks only their linked children, in any group', async () => {
    const child = { id: 'child', nickname: 'Lion', group_id: 'u10', jersey_number: null, jersey_color: null, eye_color: null, gender: null, mascot_id: 'lion' }
    const parent: AccountSession = {
      ...session, user: { ...session.user, email: 'mum@example.com' },
      groupIds: [], memberships: [], children: [child],
    }
    postMock.mockResolvedValueOnce({}).mockResolvedValueOnce(parent)
    const { result, rerender } = renderHook(({ groupId }) => useTrainerAccess(groupId), { initialProps: { groupId: 'u8' } })
    await act(async () => {
      expect(await result.current.requestLoginCode('mum@example.com')).toBe(true)
      expect(await result.current.verifyLoginCode('mum@example.com', '123456')).toBe(true)
    })
    expect(result.current.unlocked).toBe(true)
    expect(result.current.kind).toBe('parent')
    expect(result.current.children).toEqual([child])
    rerender({ groupId: 'u10' })
    expect(result.current.kind).toBe('parent')
  })

  it('clears parent codes left on the device by the old flow', async () => {
    localStorage.setItem('sports-training-parent-u8', '{"code":"ABC234"}')
    renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(localStorage.getItem('sports-training-parent-u8')).toBeNull())
  })

  it('removes old saved trainer passcodes from upgraded devices', async () => {
    localStorage.setItem('u8-trainer-passcode-u8', 'old-code')
    renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(localStorage.getItem('u8-trainer-passcode-u8')).toBeNull())
  })

  it('never shows a saved platform admin while a new trainer confirmation link is being validated', async () => {
    saveSession({
      ...session,
      user: { ...session.user, id: 'admin-1', email: 'admin@example.com', superadmin: true },
      memberships: [],
    })
    window.location.hash = 'access_token=new-access&refresh_token=new-refresh&expires_in=3600'
    const newTrainer = {
      user: { id: 'new-trainer', email: 'new@example.com', superadmin: false },
      groupIds: [], memberships: [], children: [],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(newTrainer) }))

    const { result } = renderHook(() => useTrainerAccess('u8'))
    expect(result.current.isSuperadmin).toBe(false)
    expect(result.current.signedInEmail).toBe('')
    await waitFor(() => expect(result.current.signedInEmail).toBe('new@example.com'))
    expect(result.current.needsWorkspace).toBe(true)
    expect(localStorage.getItem('sports-training-account-session')).toContain('new-access')
    expect(getMock).not.toHaveBeenCalledWith('/auth/me')
  })

  it('lets a superadmin bootstrap a workspace owner', async () => {
    const admin: AccountSession = {
      ...session,
      user: {
        ...session.user,
        email: 'admin@example.com',
        superadmin: true,
      },
      memberships: [],
    }

    saveSession(admin)
    getMock.mockResolvedValue({ groupIds: ['u8'], memberships: [] })
    postMock.mockResolvedValueOnce({ invited: true })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await waitFor(() => expect(result.current.isSuperadmin).toBe(true))

    await act(async () => {
      await result.current.inviteOwner('owner@example.com')
    })

    expect(postMock).toHaveBeenCalledWith('/auth/invite', {
      email: 'owner@example.com',
      groupId: 'u8',
      role: 'owner',
    })
  })

  it('shows invite permission for a club owner and calls the invite endpoint', async () => {
    const owner = { ...session, memberships: [{ club_id: 'club-1', group_id: null, role: 'owner', active: true }] }
    saveSession(owner)
    getMock.mockResolvedValue({ groupIds: ['u8'], memberships: owner.memberships })
    postMock.mockResolvedValueOnce({ invited: true })
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(result.current.canInvite).toBe(true))
    await act(async () => { await result.current.inviteTrainer('colleague@example.com') })
    expect(postMock).toHaveBeenCalledWith('/auth/invite', { email: 'colleague@example.com', groupId: 'u8', role: 'trainer' })
  })

  it('lets a club admin manage invitations without granting trainer access', async () => {
    const clubAdmin = { ...session, groupIds: [], memberships: [{ club_id: 'club-1', group_id: null, role: 'club_admin', active: true }] }
    saveSession(clubAdmin)
    getMock.mockResolvedValue({ groupIds: [], memberships: clubAdmin.memberships })
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(result.current.accountRole).toBe('club_admin'))
    expect(result.current.canInvite).toBe(true)
    expect(result.current.unlocked).toBe(false)
    expect(result.current.clubId).toBe('club-1')
  })

  it('invites a trainer to several groups in one call', async () => {
    const owner = { ...session, memberships: [{ club_id: 'club-1', group_id: null, role: 'owner', active: true }] }
    saveSession(owner)
    getMock.mockResolvedValue({ groupIds: ['u8', 'u10'], memberships: owner.memberships })
    postMock.mockResolvedValueOnce({ invited: true })
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(result.current.canInvite).toBe(true))
    await act(async () => { await result.current.inviteTrainer('colleague@example.com', ['u8', 'u10']) })
    expect(postMock).toHaveBeenCalledWith('/auth/invite', { email: 'colleague@example.com', groupIds: ['u8', 'u10'], role: 'trainer' })
  })

  it('loads invitation status and corrects a pending trainer email through the management API', async () => {
    const invites = [{ userId: 'pending', email: 'typo@example.com', role: 'trainer', groupIds: ['u8'], status: 'pending' as const, invitedAt: '2026-09-26' }]
    getMock.mockResolvedValueOnce(invites)
    putMock.mockResolvedValueOnce({ userId: 'replacement', email: 'fixed@example.com', status: 'pending' })
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await expect(result.current.fetchTrainerInvites('club-1')).resolves.toEqual(invites)
    await expect(result.current.correctTrainerInvite('pending', 'club-1', 'fixed@example.com')).resolves.toMatchObject({ status: 'pending' })
    expect(getMock).toHaveBeenCalledWith('/auth/trainer-invites?clubId=club-1')
    expect(putMock).toHaveBeenCalledWith('/auth/trainer-invites/pending', { clubId: 'club-1', email: 'fixed@example.com' })
  })

  it('resolves clubId from any active membership, not only one scoped to the currently active group', async () => {
    const groupScoped = { ...session, memberships: [{ club_id: 'club-1', group_id: 'u10', role: 'trainer', active: true }] }
    saveSession(groupScoped)
    getMock.mockResolvedValue({ groupIds: ['u10'], memberships: groupScoped.memberships })
    // Viewing 'u8', a group this account has no membership scoped to - custom exercises are
    // club-scoped, so clubId (and the planner's "Create exercise" button) shouldn't disappear.
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(result.current.clubId).toBe('club-1'))
  })

  it('reports which roles the signed-in account has (parent, trainer, admin)', async () => {
    saveSession(session)
    const { result } = renderHook(() => useTrainerAccess('u8'))
    expect(result.current.roles).toEqual({ parent: false, trainer: true, admin: false })
    saveSession({ ...session, user: { ...session.user, superadmin: true }, children: [{ id: 'kid', nickname: 'Milo', group_id: 'u8', jersey_number: null, jersey_color: null, eye_color: null, gender: null, mascot_id: null }] })
    const { result: both } = renderHook(() => useTrainerAccess('u8'))
    expect(both.current.roles).toEqual({ parent: true, trainer: true, admin: true })
  })
})
