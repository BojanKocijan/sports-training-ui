import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { type TrainingPlan, usePlans } from './usePlans'

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

const stalePlan: TrainingPlan = {
  id: 'old-plan',
  group_id: 'u8',
  training_date: '2026-09-20',
  title: 'Old plan',
  emoji: '🏀',
  exercise_ids: ['old'],
  created_at: '2026-09-01T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
}

const freshPlan: TrainingPlan = {
  id: 'fresh-plan',
  group_id: 'u8',
  training_date: '2026-09-21',
  title: 'Fresh plan',
  emoji: '🏀',
  exercise_ids: ['fresh'],
  created_at: '2026-09-18T10:00:00.000Z',
  updated_at: '2026-09-18T10:00:00.000Z',
}

describe('usePlans forced refresh', () => {
  it('fetches again after an already-running stale request finishes', async () => {
    let resolveInitial!: (value: TrainingPlan[]) => void

    getMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveInitial = resolve
        }),
      )
      .mockResolvedValueOnce([freshPlan])

    const { result } = renderHook(() => usePlans('u8'))

    await waitFor(() => {
      expect(getMock).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      const forcedRefresh = result.current.refresh()

      resolveInitial([stalePlan])

      await forcedRefresh
    })

    expect(getMock).toHaveBeenCalledTimes(2)

    await waitFor(() => {
      expect(result.current.plans).toEqual([freshPlan])
    })
  })
})
