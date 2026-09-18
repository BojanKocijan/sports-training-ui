import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { useTrainerAccess } from './useTrainerAccess'

vi.mock('../lib/apiClient', () => ({
  api: {
    post: vi.fn(),
  },
}))

const postMock = vi.mocked(api.post)

describe('useTrainerAccess', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('unlocks a trainer with a valid trainer code', async () => {
    postMock.mockResolvedValue({
      valid: true,
      kind: 'trainer',
    })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await act(async () => {
      const unlocked = await result.current.tryUnlock('trainer-code', true)
      expect(unlocked).toBe(true)
    })

    expect(postMock).toHaveBeenCalledWith('/auth/verify-passcode', {
      groupId: 'u8',
      passcode: 'trainer-code',
    })

    expect(result.current.unlocked).toBe(true)
    expect(result.current.kind).toBe('trainer')
    expect(result.current.parentPlayer).toBeNull()
    expect(result.current.passcode()).toBe('trainer-code')

    expect(localStorage.getItem('u8-trainer-unlocked-u8')).toBe('1')
    expect(localStorage.getItem('u8-trainer-passcode-u8')).toBe('trainer-code')
    expect(localStorage.getItem('u8-trainer-kind-u8')).toBe('trainer')
  })

  it('rejects an invalid code and keeps the group locked', async () => {
    postMock.mockResolvedValue({
      valid: false,
    })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await act(async () => {
      const unlocked = await result.current.tryUnlock('wrong-code', true)
      expect(unlocked).toBe(false)
    })

    expect(result.current.unlocked).toBe(false)
    expect(result.current.kind).toBeNull()
    expect(result.current.parentPlayer).toBeNull()
    expect(result.current.error).toBe('Wrong code, try again.')

    expect(localStorage.getItem('u8-trainer-unlocked-u8')).toBeNull()
  })

  it('unlocks a parent and scopes access to that player', async () => {
    postMock.mockResolvedValue({
      valid: true,
      kind: 'parent',
      player: {
        id: 'player-1',
        nickname: 'Mario',
      },
    })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await act(async () => {
      const unlocked = await result.current.tryUnlock('parent-code', true)
      expect(unlocked).toBe(true)
    })

    expect(result.current.unlocked).toBe(true)
    expect(result.current.kind).toBe('parent')
    expect(result.current.parentPlayer).toEqual({
      id: 'player-1',
      nickname: 'Mario',
    })
    expect(result.current.passcode()).toBe('parent-code')

    expect(localStorage.getItem('u8-trainer-kind-u8')).toBe('parent')
    expect(
      JSON.parse(localStorage.getItem('u8-trainer-parent-player-u8') ?? '{}'),
    ).toEqual({
      id: 'player-1',
      nickname: 'Mario',
    })
  })

  it('does not leak access when switching to another group', async () => {
    postMock.mockResolvedValue({
      valid: true,
      kind: 'trainer',
    })

    const { result, rerender } = renderHook(
      ({ groupId }) => useTrainerAccess(groupId),
      {
        initialProps: {
          groupId: 'u8',
        },
      },
    )

    await act(async () => {
      await result.current.tryUnlock('u8-code', false)
    })

    expect(result.current.unlocked).toBe(true)
    expect(result.current.kind).toBe('trainer')
    expect(result.current.passcode()).toBe('u8-code')

    rerender({
      groupId: 'u10',
    })

    expect(result.current.unlocked).toBe(false)
    expect(result.current.kind).toBeNull()
    expect(result.current.parentPlayer).toBeNull()
    expect(result.current.passcode()).toBe('')
  })

  it('keeps session-only access out of localStorage', async () => {
    postMock.mockResolvedValue({
      valid: true,
      kind: 'trainer',
    })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await act(async () => {
      await result.current.tryUnlock('session-code', false)
    })

    expect(result.current.unlocked).toBe(true)
    expect(result.current.passcode()).toBe('session-code')

    expect(localStorage.getItem('u8-trainer-unlocked-u8')).toBeNull()
    expect(localStorage.getItem('u8-trainer-passcode-u8')).toBeNull()
    expect(localStorage.getItem('u8-trainer-kind-u8')).toBeNull()
  })

  it('locks the active group and clears remembered access', async () => {
    postMock.mockResolvedValue({
      valid: true,
      kind: 'trainer',
    })

    const { result } = renderHook(() => useTrainerAccess('u8'))

    await act(async () => {
      await result.current.tryUnlock('trainer-code', true)
    })

    expect(result.current.unlocked).toBe(true)

    act(() => {
      result.current.lock()
    })

    expect(result.current.unlocked).toBe(false)
    expect(result.current.kind).toBeNull()
    expect(result.current.passcode()).toBe('')

    expect(localStorage.getItem('u8-trainer-unlocked-u8')).toBeNull()
    expect(localStorage.getItem('u8-trainer-passcode-u8')).toBeNull()
    expect(localStorage.getItem('u8-trainer-kind-u8')).toBeNull()
    expect(localStorage.getItem('u8-trainer-parent-player-u8')).toBeNull()
  })
})
