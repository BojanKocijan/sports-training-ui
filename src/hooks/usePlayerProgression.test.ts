import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiRequestError } from '../lib/apiClient'
import { usePlayerProgression, type PlayerProgression } from './usePlayerProgression'

vi.mock('../lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../lib/apiClient')>('../lib/apiClient')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    isApiConfigured: true,
  }
})

const getMock = vi.mocked(api.get)
const postMock = vi.mocked(api.post)

const progression: PlayerProgression = {
  sportId: 'basketball',
  points: 8,
  milestones: [
    {
      id: 'm-1',
      sport_id: 'basketball',
      group_template_id: 'u8',
      type: 'badge',
      threshold_points: 5,
      name: 'First steps',
      emoji: '🏅',
      sort_order: 1,
      target_group_template_id: null,
      skillCategoryIds: ['dribbling'],
      points: 5,
      state: 'awarded',
      awardedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'm-2',
      sport_id: 'basketball',
      group_template_id: 'u8',
      type: 'diploma',
      threshold_points: 8,
      name: 'Dribble diploma',
      emoji: '🎓',
      sort_order: 2,
      target_group_template_id: null,
      skillCategoryIds: ['dribbling'],
      points: 8,
      state: 'eligible',
      awardedAt: null,
    },
    {
      id: 'm-3',
      sport_id: 'basketball',
      group_template_id: 'u8',
      type: 'promotion',
      threshold_points: 20,
      name: 'Ready for U10',
      emoji: '⬆️',
      sort_order: 3,
      target_group_template_id: 'u10',
      skillCategoryIds: [],
      points: 20,
      state: 'locked',
      awardedAt: null,
    },
  ],
}

describe('usePlayerProgression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads a player progression by id', async () => {
    getMock.mockResolvedValueOnce(progression)

    const { result } = renderHook(() => usePlayerProgression('player-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(getMock).toHaveBeenCalledWith('/players/player-1/progression')
    expect(result.current.progression).toEqual(progression)
    expect(result.current.error).toBeNull()
  })

  it('surfaces a load error', async () => {
    getMock.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => usePlayerProgression('player-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('boom')
    expect(result.current.progression).toBeNull()
  })

  it('awards a milestone and refreshes progression', async () => {
    getMock.mockResolvedValueOnce(progression)
    const { result } = renderHook(() => usePlayerProgression('player-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const awarded: PlayerProgression = {
      ...progression,
      milestones: progression.milestones.map((m) => (m.id === 'm-2' ? { ...m, state: 'awarded', awardedAt: '2026-09-01T10:00:00.000Z' } : m)),
    }
    postMock.mockResolvedValueOnce(undefined)
    getMock.mockResolvedValueOnce(awarded)

    await act(async () => {
      await result.current.award('m-2')
    })

    expect(postMock).toHaveBeenCalledWith('/players/player-1/milestones/m-2/award', {})
    expect(result.current.progression).toEqual(awarded)
    expect(result.current.awardError).toBeNull()
    expect(result.current.awardingId).toBeNull()
  })

  it('surfaces a friendly message when the award is not yet eligible (409)', async () => {
    getMock.mockResolvedValueOnce(progression)
    const { result } = renderHook(() => usePlayerProgression('player-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    postMock.mockRejectedValueOnce(new ApiRequestError('Conflict', 409))

    await act(async () => {
      await result.current.award('m-3')
    })

    expect(result.current.awardError).toBe('Not eligible yet, or already awarded.')
  })
})
