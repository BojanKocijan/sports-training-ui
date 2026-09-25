import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlanTrainingWizard } from './PlanTrainingWizard'

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [{ id: 'dribbling', label: 'Dribbling', emoji: '🏀' }],
    loading: false,
    error: null,
  }),
  categoryInfo: (categories: Array<{ id: string; label: string; emoji: string }>, id: string) =>
    categories.find((c) => c.id === id) ?? { id, label: id, emoji: '🏀' },
}))

vi.mock('../hooks/useExercises', async () => {
  const actual = await vi.importActual<typeof import('../hooks/useExercises')>('../hooks/useExercises')
  return {
    ...actual,
    useExercises: () => ({
      exercises: [
        { id: 'ex1', emoji: '🏀', title: 'Cone dribble', categories: ['dribbling'], durationMinutes: 5, goal: 'Keep the ball close', steps: ['Set two cones'] },
        { id: 'ex2', emoji: '🎯', title: 'Passing lines', categories: ['dribbling'], durationMinutes: 10, goal: 'Chest pass accuracy', steps: ['Pair up'] },
      ],
      loading: false,
      error: null,
    }),
  }
})

const baseProps = {
  groupLabel: 'U10',
  templateId: 'u10',
  takenDates: [] as string[],
  saving: false,
  saveError: null,
  onCancel: vi.fn(),
  onSave: vi.fn(),
}

describe('PlanTrainingWizard', () => {
  it('has no Review step: only When?, Focus, Exercises', () => {
    render(<PlanTrainingWizard mode="create" initialDate="" initialExerciseIds={[]} {...baseProps} />)
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
    expect(screen.queryByText(/review/i)).not.toBeInTheDocument()
  })

  it('requires a date before moving past the When? step, in both create and edit', () => {
    render(<PlanTrainingWizard mode="create" initialDate="" initialExerciseIds={[]} {...baseProps} />)
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('shows the big total-minutes readout in the header, reflecting current selection', () => {
    render(<PlanTrainingWizard mode="edit" initialDate="2026-01-10" initialExerciseIds={['ex1', 'ex2']} {...baseProps} />)
    expect(screen.getByText('15′')).toBeInTheDocument()
    expect(screen.getByText('2 exercises')).toBeInTheDocument()
  })

  it('reaches Save directly from the Exercises step, with no Review step in between', async () => {
    const user = userEvent.setup()
    render(<PlanTrainingWizard mode="edit" initialDate="2026-01-10" initialExerciseIds={['ex1']} {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument()
  })

  it('the date stays editable when editing an existing training', () => {
    render(<PlanTrainingWizard mode="edit" initialDate="2026-01-10" initialExerciseIds={['ex1']} {...baseProps} />)
    expect(screen.getByText(/training date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })
})
