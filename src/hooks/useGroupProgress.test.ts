import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { useGroupProgress } from './useGroupProgress'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)

describe('useGroupProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads only the requested group progress endpoint and aggregates its historical rows', async () => {
    getMock.mockResolvedValueOnce([
      {
        rating: 2,
        created_at: '2026-07-01T10:00:00.000Z',
        skill_categories: {
          id: 'dribbling',
          label: 'Dribbling',
          emoji: '🏀',
        },
      },
      {
        rating: 3,
        created_at: '2026-09-01T10:00:00.000Z',
        skill_categories: {
          id: 'dribbling',
          label: 'Dribbling',
          emoji: '🏀',
        },
      },
      {
        rating: 3,
        created_at: '2026-08-15T10:00:00.000Z',
        skill_categories: {
          id: 'passing',
          label: 'Passing',
          emoji: '🤝',
        },
      },
    ])

    const { result } = renderHook(() => useGroupProgress('u8'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getMock).toHaveBeenCalledWith('/groups/u8/progress')

    expect(result.current.byCategory).toEqual([
      {
        categoryId: 'passing',
        label: 'Passing',
        emoji: '🤝',
        average: 3,
        count: 1,
        lastRatedAt: '2026-08-15T10:00:00.000Z',
      },
      {
        categoryId: 'dribbling',
        label: 'Dribbling',
        emoji: '🏀',
        average: 2.5,
        count: 2,
        lastRatedAt: '2026-09-01T10:00:00.000Z',
      },
    ])
  })

  it('ignores rows whose skill category no longer resolves', async () => {
    getMock.mockResolvedValueOnce([
      {
        rating: 3,
        created_at: '2026-09-01T10:00:00.000Z',
        skill_categories: null,
      },
      {
        rating: 2,
        created_at: '2026-09-02T10:00:00.000Z',
        skill_categories: {
          id: 'shooting',
          label: 'Shooting',
          emoji: '🎯',
        },
      },
    ])

    const { result } = renderHook(() => useGroupProgress('u8'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.byCategory).toEqual([
      {
        categoryId: 'shooting',
        label: 'Shooting',
        emoji: '🎯',
        average: 2,
        count: 1,
        lastRatedAt: '2026-09-02T10:00:00.000Z',
      },
    ])
  })
})
