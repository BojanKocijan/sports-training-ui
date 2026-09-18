import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { groupSkillCategories, useSkillCategories } from './useSkillCategories'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
  },
  isApiConfigured: true,
}))

const getMock = vi.mocked(api.get)

describe('useSkillCategories', () => {
  it('deduplicates the request and maps parent relationships', async () => {
    let resolveRequest!: (value: unknown[]) => void

    getMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const first = renderHook(() => useSkillCategories())
    const second = renderHook(() => useSkillCategories())

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/skill-categories?sportId=basketball')

    resolveRequest([
      {
        id: 'dribbling',
        label: 'Dribbling',
        emoji: '🏀',
        parent_id: null,
      },
      {
        id: 'dribbling_weak',
        label: 'Weak hand',
        emoji: '↔️',
        parent_id: 'dribbling',
      },
    ])

    await waitFor(() => {
      expect(first.result.current.skillCategories).toEqual([
        {
          id: 'dribbling',
          label: 'Dribbling',
          emoji: '🏀',
          parentId: null,
        },
        {
          id: 'dribbling_weak',
          label: 'Weak hand',
          emoji: '↔️',
          parentId: 'dribbling',
        },
      ])

      expect(second.result.current.skillCategories).toHaveLength(2)
    })
  })

  it('groups top-level skills with their children', () => {
    expect(
      groupSkillCategories([
        {
          id: 'dribbling',
          label: 'Dribbling',
          emoji: '🏀',
          parentId: null,
        },
        {
          id: 'dribbling_weak',
          label: 'Weak hand',
          emoji: '↔️',
          parentId: 'dribbling',
        },
        {
          id: 'passing',
          label: 'Passing',
          emoji: '🤝',
          parentId: null,
        },
      ]),
    ).toEqual([
      {
        parent: {
          id: 'dribbling',
          label: 'Dribbling',
          emoji: '🏀',
          parentId: null,
        },
        children: [
          {
            id: 'dribbling_weak',
            label: 'Weak hand',
            emoji: '↔️',
            parentId: 'dribbling',
          },
        ],
      },
      {
        parent: {
          id: 'passing',
          label: 'Passing',
          emoji: '🤝',
          parentId: null,
        },
        children: [],
      },
    ])
  })
})
