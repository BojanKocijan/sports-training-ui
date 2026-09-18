import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { useSessionClock } from './useSessionClock'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const getMock = vi.mocked(api.get)
const postMock = vi.mocked(api.post)

describe('useSessionClock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the shared session state for the group', async () => {
    getMock.mockResolvedValue({
      status: 'paused',
      elapsedSeconds: 12,
    })

    const { result } = renderHook(() =>
      useSessionClock('u8', () => 'trainer-code'),
    )

    await waitFor(() => {
      expect(result.current.elapsedSeconds).toBe(12)
      expect(result.current.running).toBe(false)
    })

    expect(getMock).toHaveBeenCalledWith('/sessions/u8')
  })

  it('interpolates elapsed time while the server clock is running', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)

    getMock.mockResolvedValue({
      status: 'running',
      elapsedSeconds: 10,
    })

    const { result, unmount } = renderHook(() =>
      useSessionClock('u8', () => 'trainer-code'),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.running).toBe(true)
    expect(result.current.elapsedSeconds).toBe(10)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    expect(result.current.elapsedSeconds).toBe(11)

    unmount()
  })

  it('sends start, pause, seek and reset with the trainer passcode', async () => {
    getMock.mockResolvedValue({
      status: 'paused',
      elapsedSeconds: 0,
    })

    postMock.mockImplementation(async (path) => {
      if (path === '/sessions/u8/start') {
        return { status: 'running', elapsedSeconds: 0 }
      }

      if (path === '/sessions/u8/pause') {
        return { status: 'paused', elapsedSeconds: 7 }
      }

      if (path === '/sessions/u8/seek') {
        return { status: 'paused', elapsedSeconds: 13 }
      }

      return { status: 'idle', elapsedSeconds: 0 }
    })

    const { result } = renderHook(() =>
      useSessionClock('u8', () => 'trainer-code'),
    )

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledWith('/sessions/u8')
    })

    await act(async () => {
      await result.current.start()
    })

    expect(postMock).toHaveBeenCalledWith('/sessions/u8/start', {
      passcode: 'trainer-code',
    })
    expect(result.current.running).toBe(true)

    await act(async () => {
      await result.current.pause()
    })

    expect(postMock).toHaveBeenCalledWith('/sessions/u8/pause', {
      passcode: 'trainer-code',
    })
    expect(result.current.elapsedSeconds).toBe(7)

    await act(async () => {
      await result.current.jumpTo(12.6)
    })

    expect(postMock).toHaveBeenCalledWith('/sessions/u8/seek', {
      passcode: 'trainer-code',
      seconds: 13,
    })
    expect(result.current.elapsedSeconds).toBe(13)

    await act(async () => {
      await result.current.reset()
    })

    expect(postMock).toHaveBeenCalledWith('/sessions/u8/reset', {
      passcode: 'trainer-code',
    })
    expect(result.current.elapsedSeconds).toBe(0)
    expect(result.current.running).toBe(false)
  })

  it('never seeks below zero', async () => {
    getMock.mockResolvedValue({
      status: 'paused',
      elapsedSeconds: 5,
    })

    postMock.mockResolvedValue({
      status: 'paused',
      elapsedSeconds: 0,
    })

    const { result } = renderHook(() =>
      useSessionClock('u8', () => 'trainer-code'),
    )

    await waitFor(() => {
      expect(result.current.elapsedSeconds).toBe(5)
    })

    await act(async () => {
      await result.current.jumpTo(-20)
    })

    expect(postMock).toHaveBeenCalledWith('/sessions/u8/seek', {
      passcode: 'trainer-code',
      seconds: 0,
    })
  })

  it('surfaces a control error and refreshes when the group changes', async () => {
    getMock.mockImplementation(async (path) => {
      if (path === '/sessions/u10') {
        return { status: 'paused', elapsedSeconds: 4 }
      }

      return { status: 'paused', elapsedSeconds: 8 }
    })

    postMock.mockRejectedValueOnce(new Error('Forbidden'))

    const { result, rerender } = renderHook(
      ({ groupId }) => useSessionClock(groupId, () => 'trainer-code'),
      {
        initialProps: { groupId: 'u8' },
      },
    )

    await waitFor(() => {
      expect(result.current.elapsedSeconds).toBe(8)
    })

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.controlError).toBe('Forbidden')

    rerender({ groupId: 'u10' })

    await waitFor(() => {
      expect(result.current.elapsedSeconds).toBe(4)
    })

    expect(getMock).toHaveBeenCalledWith('/sessions/u10')
  })
})
