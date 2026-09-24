import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('shows the selected theme as a filled icon and the others outlined', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Dark' }).querySelector('svg')).toHaveAttribute('fill', 'currentColor')
    expect(screen.getByRole('radio', { name: 'Light' }).querySelector('svg')).toHaveAttribute('fill', 'none')
    expect(screen.getByRole('radio', { name: 'System' }).querySelector('svg')).toHaveAttribute('fill', 'none')
  })
})
