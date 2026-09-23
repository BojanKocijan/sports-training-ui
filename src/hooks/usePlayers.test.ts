import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { type Player, usePlayers } from './usePlayers'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)
const postMock = vi.mocked(api.post)
const putMock = vi.mocked(api.put)
const deleteMock = vi.mocked(api.delete)

const playerU8: Player = {
  id: 'player-1',
  group_id: 'u8',
  nickname: 'Mila',
  jersey_number: 12,
  jersey_color: 'blue',
  eye_color: null,
  gender: null,
  height_cm: 128,
  weight_kg: 27,
  mascot_id: 'lion',
  created_at: '2026-09-01T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
}

describe('usePlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the roster for the requested group', async () => {
    getMock.mockResolvedValueOnce([playerU8])

    const { result } = renderHook(() => usePlayers('u8'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.players).toEqual([playerU8])
    })

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/players?groupId=u8')
    expect(result.current.error).toBeNull()
  })

  it('creates a player in the current group and refreshes the roster', async () => {
    getMock.mockResolvedValueOnce([]).mockResolvedValueOnce([playerU8])
    postMock.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePlayers('u8'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.createPlayer(
        'Mila',
        12,
        'blue',
        128,
        27,
        'lion',
      )
    })

    expect(postMock).toHaveBeenCalledWith('/players', {
      groupId: 'u8',
      nickname: 'Mila',
      jerseyNumber: 12,
      jerseyColor: 'blue',
      heightCm: 128,
      weightKg: 27,
      mascotId: 'lion',
      eyeColor: null,
      gender: null,
    })

    expect(getMock).toHaveBeenCalledTimes(2)

    await waitFor(() => {
      expect(result.current.players).toEqual([playerU8])
    })
  })

  it('moves a player from U8 to U10 and refreshes the original roster', async () => {
    getMock.mockResolvedValueOnce([playerU8]).mockResolvedValueOnce([])
    putMock.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePlayers('u8'))

    await waitFor(() => {
      expect(result.current.players).toEqual([playerU8])
    })

    await act(async () => {
      await result.current.updatePlayer(
        playerU8.id,
        'u10',
        'Mila',
        12,
        'blue',
        128,
        27,
        'lion',
      )
    })

    expect(putMock).toHaveBeenCalledWith('/players/player-1', {
      groupId: 'u10',
      nickname: 'Mila',
      jerseyNumber: 12,
      jerseyColor: 'blue',
      heightCm: 128,
      weightKg: 27,
      mascotId: 'lion',
      eyeColor: null,
      gender: null,
    })

    expect(getMock).toHaveBeenCalledTimes(2)

    await waitFor(() => {
      expect(result.current.players).toEqual([])
    })
  })

  it('deletes a player and refreshes the roster', async () => {
    getMock.mockResolvedValueOnce([playerU8]).mockResolvedValueOnce([])
    deleteMock.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePlayers('u8'))

    await waitFor(() => {
      expect(result.current.players).toEqual([playerU8])
    })

    await act(async () => {
      await result.current.deletePlayer( playerU8.id)
    })

    expect(deleteMock).toHaveBeenCalledWith('/players/player-1')

    expect(getMock).toHaveBeenCalledTimes(2)

    await waitFor(() => {
      expect(result.current.players).toEqual([])
    })
  })
})
