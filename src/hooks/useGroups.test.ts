import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { useGroups } from './useGroups'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)

let now = 0

describe('useGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    now += 120_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads and maps group metadata', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'group-u8',
        template_id: 'u8',
        name: 'Dunckers U8',
        group_templates: {
          label: 'U8',
          emoji: '🏀',
          status: 'available',
        },
      },
    ])

    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.groups).toEqual([
        {
          id: 'group-u8',
          templateId: 'u8',
          name: 'Dunckers U8',
          emoji: '🏀',
          status: 'available',
        },
      ])
    })

    expect(getMock).toHaveBeenCalledWith('/groups')
  })

  it('deduplicates concurrent group requests', async () => {
    let resolveRequest!: (value: unknown[]) => void

    getMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const first = renderHook(() => useGroups())
    const second = renderHook(() => useGroups())

    expect(getMock).toHaveBeenCalledTimes(1)

    resolveRequest([
      {
        id: 'group-u10',
        template_id: 'u10',
        name: 'Dunckers U10',
        group_templates: {
          label: 'U10',
          emoji: '🏀',
          status: 'available',
        },
      },
    ])

    await waitFor(() => {
      expect(first.result.current.groups).toHaveLength(1)
      expect(second.result.current.groups).toHaveLength(1)
    })
  })

  it('reuses a fresh cache without another API request', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'group-u8',
        template_id: 'u8',
        name: 'Dunckers U8',
        group_templates: {
          label: 'U8',
          emoji: '🏀',
          status: 'available',
        },
      },
    ])

    const first = renderHook(() => useGroups())

    await waitFor(() => {
      expect(first.result.current.groups).toHaveLength(1)
    })

    first.unmount()

    const second = renderHook(() => useGroups())

    await waitFor(() => {
      expect(second.result.current.groups).toHaveLength(1)
    })

    expect(getMock).toHaveBeenCalledTimes(1)
  })

  it('uses safe defaults when a group template relation is missing', async () => {
    getMock.mockResolvedValueOnce([
      {
        id: 'group-x',
        template_id: 'u12',
        name: 'Future group',
        group_templates: null,
      },
    ])

    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.groups).toEqual([
        {
          id: 'group-x',
          templateId: 'u12',
          name: 'Future group',
          emoji: '🏀',
          status: 'available',
        },
      ])
    })
  })
})
