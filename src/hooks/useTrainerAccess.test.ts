import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { saveSession, type AccountSession } from '../lib/accountSession'
import { useTrainerAccess } from './useTrainerAccess'

vi.mock('../lib/apiClient', () => ({ api: { post: vi.fn(), get: vi.fn() }, apiBaseUrl: 'http://localhost:3002' }))
const postMock = vi.mocked(api.post)
const getMock = vi.mocked(api.get)
const session: AccountSession = {
  accessToken: 'jwt', refreshToken: 'refresh', expiresAt: 9999999999,
  user: { id: 'trainer-1', email: 'trainer@example.com', superadmin: false },
  groupIds: ['u8'], memberships: [{ club_id: 'club-1', group_id: 'u8', role: 'trainer', active: true }],
}

beforeEach(() => {
  saveSession(null)
  localStorage.clear()
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

  it('keeps a parent code separate and scoped to one child/group', async () => {
    postMock.mockResolvedValueOnce({ valid: true, kind: 'parent', player: { id: 'child', nickname: 'Lion' } })
    const { result, rerender } = renderHook(({ groupId }) => useTrainerAccess(groupId), { initialProps: { groupId: 'u8' } })
    await act(async () => { expect(await result.current.tryUnlock('ABC234', true)).toBe(true) })
    expect(postMock).toHaveBeenCalledWith('/auth/verify-parent-code', { groupId: 'u8', code: 'ABC234' })
    expect(result.current.kind).toBe('parent')
    expect(result.current.parentPlayer).toEqual({ id: 'child', nickname: 'Lion' })
    expect(localStorage.getItem('sports-training-parent-u8')).toContain('ABC234')
    rerender({ groupId: 'u10' })
    expect(result.current.unlocked).toBe(false)
  })

  it('rejects an invalid parent code', async () => {
    postMock.mockResolvedValueOnce({ valid: false })
    const { result } = renderHook(() => useTrainerAccess('u8'))
    await act(async () => { expect(await result.current.tryUnlock('wrong', false)).toBe(false) })
    expect(result.current.error).toBe('Wrong parent code, try again.')
  })

  it('removes old saved trainer passcodes from upgraded devices', async () => {
    localStorage.setItem('u8-trainer-passcode-u8', 'old-code')
    renderHook(() => useTrainerAccess('u8'))
    await waitFor(() => expect(localStorage.getItem('u8-trainer-passcode-u8')).toBeNull())
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
})
