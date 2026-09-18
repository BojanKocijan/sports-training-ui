import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlans } from '../hooks/usePlans'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import { ParentView } from './ParentView'

vi.mock('../hooks/usePlayerProgress', () => ({
  usePlayerProgress: vi.fn(),
}))

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      {
        id: 'dribbling',
        label: 'Dribbling',
        emoji: '🏀',
      },
    ],
    loading: false,
    error: null,
  }),

  categoryInfo: (
    categories: Array<{ id: string; label: string; emoji: string }>,
    categoryId: string,
  ) =>
    categories.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      label: categoryId,
      emoji: '🏀',
    },
}))

vi.mock('../hooks/usePlans', () => ({
  usePlans: vi.fn(),
}))

vi.mock('./GroupProgressSummary', () => ({
  GroupProgressSummary: () => (
    <div data-testid="group-progress">Group progress</div>
  ),
}))

const progressMock = vi.mocked(usePlayerProgress)
const plansMock = vi.mocked(usePlans)

describe('ParentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    progressMock.mockReturnValue({
      byCategory: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    plansMock.mockReturnValue({
      plans: [],
      upcoming: [],
      past: [],
      nextPlan: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      deletePlan: vi.fn(),
    })
  })

  it('loads progress only for the parent-scoped player', () => {
    render(
      <ParentView
        groupId="u8"
        player={{
          id: 'player-1',
          nickname: 'Mila',
        }}
      />,
    )

    expect(progressMock).toHaveBeenCalledTimes(1)
    expect(progressMock).toHaveBeenCalledWith('player-1')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: "Mila's progress",
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/read-only view for parents/i)).toBeInTheDocument()
  })

  it('does not expose trainer edit, rating, delete, or parent-code controls', () => {
    render(
      <ParentView
        groupId="u8"
        player={{
          id: 'player-1',
          nickname: 'Mila',
        }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: /^edit$/i }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: /remove|delete/i }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: /generate code|regenerate code|revoke code/i,
      }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: /rate/i }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByText(/parent code · visible to trainers only/i),
    ).not.toBeInTheDocument()
  })

  it('shows read-only progress and upcoming training data', () => {
    progressMock.mockReturnValue({
      byCategory: [
        {
          categoryId: 'dribbling',
          average: 2.5,
          count: 2,
          lastRatedAt: '2026-09-10T10:00:00.000Z',
        },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    plansMock.mockReturnValue({
      plans: [],
      upcoming: [
        {
          id: 'plan-1',
          group_id: 'u8',
          training_date: '2099-09-20',
          title: 'U8 training',
          emoji: '🏀',
          exercise_ids: ['ex-1'],
          created_at: '2026-09-01T10:00:00.000Z',
          updated_at: '2026-09-01T10:00:00.000Z',
        },
      ],
      past: [],
      nextPlan: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      deletePlan: vi.fn(),
    })

    render(
      <ParentView
        groupId="u8"
        player={{
          id: 'player-1',
          nickname: 'Mila',
        }}
      />,
    )

    expect(screen.getByText(/upcoming trainings/i)).toBeInTheDocument()
    expect(screen.getByTestId('group-progress')).toBeInTheDocument()
  })
})
