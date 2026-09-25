import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateExerciseDialog } from './CreateExerciseDialog'

const createExercise = vi.fn()
const updateExercise = vi.fn()

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: 'dribbling', label: 'Dribbling', emoji: '🏀' },
      { id: 'trainer_addons', label: 'Trainer add-ons', emoji: '🧰' },
    ],
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
    useCustomExercises: () => ({
      createExercise, updateExercise, deleteExercise: vi.fn(), requestShare: vi.fn(),
      approveShare: vi.fn(), rejectShare: vi.fn(), fetchDetails: vi.fn(),
    }),
  }
})

describe('CreateExerciseDialog', () => {
  it('never offers "trainer_addons" as a pickable category — it is applied automatically', () => {
    render(<CreateExerciseDialog open onOpenChange={vi.fn()} clubId="club-1" onSaved={vi.fn()} />)
    expect(screen.getByText('Dribbling')).toBeInTheDocument()
    expect(screen.queryByText('Trainer add-ons')).not.toBeInTheDocument()
  })

  it('disables Create until title, goal and a step are filled in', async () => {
    const user = userEvent.setup()
    render(<CreateExerciseDialog open onOpenChange={vi.fn()} clubId="club-1" onSaved={vi.fn()} />)
    expect(screen.getByRole('button', { name: /create exercise/i })).toBeDisabled()

    await user.type(screen.getByLabelText(/title/i), 'My drill')
    await user.type(screen.getByLabelText(/goal/i), 'Build something')
    await user.type(screen.getByPlaceholderText('Step 1'), 'Do the thing')

    expect(screen.getByRole('button', { name: /create exercise/i })).not.toBeDisabled()
  })

  it('creates a private exercise for the given club, with the emoji icon by default', async () => {
    createExercise.mockResolvedValue({ id: 'new-1' })
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<CreateExerciseDialog open onOpenChange={vi.fn()} clubId="club-1" onSaved={onSaved} />)

    await user.type(screen.getByLabelText(/title/i), 'My drill')
    await user.type(screen.getByLabelText(/goal/i), 'Build something')
    await user.type(screen.getByPlaceholderText('Step 1'), 'Do the thing')
    await user.click(screen.getByRole('button', { name: /create exercise/i }))

    expect(createExercise).toHaveBeenCalledExactlyOnceWith('club-1', expect.objectContaining({
      title: 'My drill', goal: 'Build something', steps: ['Do the thing'],
    }))
    expect(onSaved).toHaveBeenCalledWith({ id: 'new-1' })
  })

  it('edits an existing exercise instead of creating a new one', async () => {
    updateExercise.mockResolvedValue({ id: 'ex-1' })
    const user = userEvent.setup()
    render(
      <CreateExerciseDialog
        open
        onOpenChange={vi.fn()}
        clubId="club-1"
        editing={{
          id: 'ex-1', title: 'Old title', goal: 'Old goal', steps: ['Step one'], categories: ['dribbling'],
          durationMinutes: 5, emoji: '🏀', isCustom: true,
        }}
        onSaved={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue('Old title')).toBeInTheDocument()
    await user.clear(screen.getByLabelText(/title/i))
    await user.type(screen.getByLabelText(/title/i), 'New title')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateExercise).toHaveBeenCalledExactlyOnceWith('ex-1', expect.objectContaining({ title: 'New title' }))
  })
})
