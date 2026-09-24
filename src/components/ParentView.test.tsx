import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('../hooks/useExercises', () => ({
  useExercises: () => ({
    exercises: [{ id: 'ex1', emoji: '🏀', title: 'Cone dribble', categories: ['dribbling'], durationMinutes: 5, goal: 'Keep the ball close', steps: ['Set two cones'] }],
    loading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useGroups', () => ({
  useGroups: () => ({ groups: [], loading: false, error: null }),
}))

vi.mock('../hooks/usePlans', () => ({
  usePlans: vi.fn(),
}))

vi.mock('./player-form/PlayerPreviewCard', () => ({
  PlayerPreviewCard: ({ nickname }: { nickname: string }) => (
    <div data-testid="mascot">{nickname} mascot</div>
  ),
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

  it('shows the mascot first, then stats and trainings on their own tabs', async () => {
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

    expect(screen.getByTestId('mascot')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /stats/i }))
    expect(screen.getByText(/2\.5/)).toBeInTheDocument()
    expect(screen.queryByTestId('group-progress')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /trainings/i }))
    expect(screen.getByText(/upcoming trainings/i)).toBeInTheDocument()
  })

  it('shows an encouraging mascot message and home-practice suggestions for a low category', async () => {
    progressMock.mockReturnValue({
      byCategory: [{ categoryId: 'dribbling', average: 1.2, count: 4, lastRatedAt: '2026-09-20' }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    render(<ParentView groupId="u8" player={{ id: 'player-1', nickname: 'Mila' }} />)

    // Mascot tab (default): a message built from the ratings, framed as practising together.
    const coach = screen.getByRole('button', { name: /another message from your mascot/i })
    expect(coach).toHaveTextContent(/skills rated so far/i)
    await userEvent.click(coach)
    expect(coach).toHaveTextContent(/you keep working on Dribbling/i)
    await userEvent.click(coach)
    expect(coach).toHaveTextContent(/more time to practise Dribbling together/i)

    // Stats tab: a couple of exercises to try at home.
    await userEvent.click(screen.getByRole('tab', { name: /stats/i }))
    expect(screen.getByText(/practise together at home/i)).toBeInTheDocument()
    expect(screen.getByText(/Cone dribble/)).toBeInTheDocument()
  })

  it('shows no home-practice section when no category is low', async () => {
    progressMock.mockReturnValue({
      byCategory: [{ categoryId: 'dribbling', average: 2.7, count: 4, lastRatedAt: '2026-09-20' }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    render(<ParentView groupId="u8" player={{ id: 'player-1', nickname: 'Mila' }} />)
    await userEvent.click(screen.getByRole('tab', { name: /stats/i }))
    expect(screen.queryByText(/practise together at home/i)).not.toBeInTheDocument()
  })

  it('shows the child\'s reward badges on the mascot tab, dimming those not earned yet', () => {
    progressMock.mockReturnValue({
      byCategory: [{ categoryId: 'dribbling', average: 1.4, count: 6, lastRatedAt: '2026-09-20' }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    render(<ParentView groupId="u8" player={{ id: 'player-1', nickname: 'Mila' }} />)
    const badges = screen.getByRole('list', { name: 'Badges' })
    expect(badges).toHaveTextContent('Consistent')
    expect(screen.getByLabelText('Consistent')).toBeInTheDocument()
    expect(screen.getByLabelText('Rising star (not earned yet)')).toBeInTheDocument()
  })
})
