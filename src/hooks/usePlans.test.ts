import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../lib/apiClient', () => ({
  api: mocks,
  isApiConfigured: true,
}))

const plan = {
  id: 'plan-1',
  group_id: 'u8',
  training_date: '2099-09-20',
  title: 'U8 training',
  emoji: '🏀',
  exercise_ids: ['ex-1', 'ex-2'],
  created_at: '2099-09-01T10:00:00.000Z',
  updated_at: '2099-09-01T10:00:00.000Z',
}

async function renderPlans(groupId = 'u8') {
  const { usePlans } = await import('./usePlans')

  let hook!: ReturnType<typeof renderHook<ReturnType<typeof usePlans>, unknown>>

  await act(async () => {
    hook = renderHook(() => usePlans(groupId))

    // Let the initial API promise and useSyncExternalStore notification
    // settle while React is still inside act().
    await Promise.resolve()
    await Promise.resolve()
  })

  return hook
}

describe('usePlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('loads plans for the requested group', async () => {
    mocks.get.mockResolvedValueOnce([plan])

    const { result, unmount } = await renderPlans()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.plans).toEqual([plan])
    })

    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.get).toHaveBeenCalledWith('/plans?groupId=u8')

    expect(result.current.nextPlan).toEqual(plan)
    expect(result.current.upcoming).toEqual([plan])
    expect(result.current.past).toEqual([])

    unmount()
  })

  it('creates a plan and refreshes the shared plan list', async () => {
    mocks.get.mockResolvedValueOnce([]).mockResolvedValueOnce([plan])

    mocks.post.mockResolvedValueOnce(undefined)

    const { result, unmount } = await renderPlans()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.createPlan(
        plan.training_date,
        plan.title,
        plan.emoji,
        plan.exercise_ids,
      )
    })

    expect(mocks.post).toHaveBeenCalledWith('/plans', {
      groupId: 'u8',
      trainingDate: plan.training_date,
      title: plan.title,
      emoji: plan.emoji,
      exerciseIds: plan.exercise_ids,
    })

    await waitFor(() => {
      expect(result.current.plans).toEqual([plan])
    })

    expect(mocks.get).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('updates a plan and refreshes the shared plan list', async () => {
    const updatedPlan = {
      ...plan,
      training_date: '2099-09-21',
      title: 'Updated U8 training',
      exercise_ids: ['ex-3'],
      updated_at: '2099-09-02T10:00:00.000Z',
    }

    mocks.get.mockResolvedValueOnce([plan]).mockResolvedValueOnce([updatedPlan])

    mocks.put.mockResolvedValueOnce(undefined)

    const { result, unmount } = await renderPlans()

    await waitFor(() => {
      expect(result.current.plans).toEqual([plan])
    })

    await act(async () => {
      await result.current.updatePlan(
        plan.id,
        updatedPlan.training_date,
        updatedPlan.title,
        updatedPlan.emoji,
        updatedPlan.exercise_ids,
      )
    })

    expect(mocks.put).toHaveBeenCalledWith(`/plans/${plan.id}`, {
      trainingDate: updatedPlan.training_date,
      title: updatedPlan.title,
      emoji: updatedPlan.emoji,
      exerciseIds: updatedPlan.exercise_ids,
    })

    await waitFor(() => {
      expect(result.current.plans).toEqual([updatedPlan])
    })

    expect(mocks.get).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('deletes a plan and refreshes the shared plan list', async () => {
    mocks.get.mockResolvedValueOnce([plan]).mockResolvedValueOnce([])

    mocks.delete.mockResolvedValueOnce(undefined)

    const { result, unmount } = await renderPlans()

    await waitFor(() => {
      expect(result.current.plans).toEqual([plan])
    })

    await act(async () => {
      await result.current.deletePlan( plan.id)
    })

    expect(mocks.delete).toHaveBeenCalledWith(`/plans/${plan.id}`)

    await waitFor(() => {
      expect(result.current.plans).toEqual([])
    })

    expect(mocks.get).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('deduplicates simultaneous loads for the same group', async () => {
    let resolveRequest!: (value: (typeof plan)[]) => void

    mocks.get.mockReturnValueOnce(
      new Promise<(typeof plan)[]>((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { usePlans } = await import('./usePlans')

    const first = renderHook(() => usePlans('u8'))
    const second = renderHook(() => usePlans('u8'))

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      resolveRequest([plan])
    })

    await waitFor(() => {
      expect(first.result.current.plans).toEqual([plan])
      expect(second.result.current.plans).toEqual([plan])
    })

    expect(mocks.get).toHaveBeenCalledTimes(1)

    first.unmount()
    second.unmount()
  })
})
