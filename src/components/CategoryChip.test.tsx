import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CategoryChip } from './CategoryChip'

describe('CategoryChip', () => {
  it('renders the category label and emoji', () => {
    render(<CategoryChip categoryId="shooting" active={false} onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: /shooting/i })).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<CategoryChip categoryId="passing" active={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /passing/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('applies the active styling when active', () => {
    render(<CategoryChip categoryId="dribbling" active onToggle={() => {}} />)
    // border-primary: the brand-orange border token (see index.css --primary), not a literal
    // orange-* class — Chip is on the shared CSS-variable tokens since the shadcn migration.
    expect(screen.getByRole('button', { name: /dribbling/i }).className).toContain('border-primary')
  })
})
