import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { useMascots } from './useMascots'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)

describe('useMascots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the mascot roster', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'lion',
        name: 'Leon',
        sort_order: 1,
      },
    ])

    const { result } = renderHook(() => useMascots())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.mascots).toEqual([
        {
          id: 'lion',
          name: 'Leon',
          sort_order: 1,
        },
      ])
    })

    expect(getMock).toHaveBeenCalledWith('/mascots')
  })

  it('refreshes the roster on demand', async () => {
    getMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'lion',
        name: 'Leon',
        sort_order: 1,
      },
    ])

    const { result } = renderHook(() => useMascots())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(getMock).toHaveBeenCalledTimes(2)
    expect(result.current.mascots).toHaveLength(1)
  })

  it('surfaces API errors', async () => {
    getMock.mockRejectedValueOnce(new Error('Mascots unavailable'))

    const { result } = renderHook(() => useMascots())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Mascots unavailable')
    })
  })
})
