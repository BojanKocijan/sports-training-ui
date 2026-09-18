import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { usePlayerProgress } from './usePlayerProgress'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)

describe('usePlayerProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads progress by player id, independent of the player current group', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'rating-u8',
        player_id: 'player-1',
        plan_id: 'u8-plan',
        category_id: 'dribbling',
        rating: 2,
        created_at: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'rating-u10',
        player_id: 'player-1',
        plan_id: 'u10-plan',
        category_id: 'dribbling',
        rating: 3,
        created_at: '2026-09-01T10:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => usePlayerProgress('player-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getMock).toHaveBeenCalledWith('/players/player-1/progress')

    expect(result.current.byCategory).toEqual([
      {
        categoryId: 'dribbling',
        average: 2.5,
        count: 2,
        lastRatedAt: '2026-09-01T10:00:00.000Z',
      },
    ])
  })

  it('keeps categories separate and uses the newest rating timestamp', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'rating-1',
        player_id: 'player-1',
        plan_id: 'plan-1',
        category_id: 'passing',
        rating: 1,
        created_at: '2026-07-01T10:00:00.000Z',
      },
      {
        id: 'rating-2',
        player_id: 'player-1',
        plan_id: 'plan-2',
        category_id: 'passing',
        rating: 3,
        created_at: '2026-09-10T10:00:00.000Z',
      },
      {
        id: 'rating-3',
        player_id: 'player-1',
        plan_id: 'plan-2',
        category_id: 'shooting',
        rating: 2,
        created_at: '2026-09-05T10:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => usePlayerProgress('player-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.byCategory).toEqual([
      {
        categoryId: 'passing',
        average: 2,
        count: 2,
        lastRatedAt: '2026-09-10T10:00:00.000Z',
      },
      {
        categoryId: 'shooting',
        average: 2,
        count: 1,
        lastRatedAt: '2026-09-05T10:00:00.000Z',
      },
    ])
  })
})
