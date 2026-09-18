import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CategoryChip } from './CategoryChip'

const categories = [
  { id: 'shooting', label: 'Shooting', emoji: '🎯' },
  { id: 'passing', label: 'Passing', emoji: '🤝' },
  { id: 'dribbling', label: 'Dribbling', emoji: '🏀' },
]

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    categories,
    loading: false,
    error: null,
  }),

  categoryInfo: (
    items: Array<{ id: string; label: string; emoji: string }>,
    categoryId: string,
  ) =>
    items.find((item) => item.id === categoryId) ?? {
      id: categoryId,
      label: categoryId,
      emoji: '',
    },
}))

describe('CategoryChip', () => {
  it('renders the category label and emoji', () => {
    render(
      <CategoryChip categoryId="shooting" active={false} onToggle={() => {}} />,
    )

    expect(
      screen.getByRole('button', { name: /shooting/i }),
    ).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()

    render(
      <CategoryChip categoryId="passing" active={false} onToggle={onToggle} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /passing/i }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('applies the active styling when active', () => {
    render(<CategoryChip categoryId="dribbling" active onToggle={() => {}} />)

    expect(
      screen.getByRole('button', { name: /dribbling/i }).className,
    ).toContain('border-primary')
  })
})
