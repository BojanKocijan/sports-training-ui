import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { LandingPage } from './LandingPage'

const access = {
  checking: false,
  error: null,
  requestLoginCode: vi.fn(),
  verifyLoginCode: vi.fn(),
} as unknown as ReturnType<typeof useTrainerAccess>

describe('LandingPage', () => {
  it('offers a trainer sign-in and explains how parents get in', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByRole('heading', { name: /trainer sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByText(/child’s trainer invites you by email/i)).toBeInTheDocument()
  })

  it('shows basketball as available and more sports as coming soon', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByText(/basketball · available now/i)).toBeInTheDocument()
    expect(screen.getByText(/more coming soon/i)).toBeInTheDocument()
  })

  it('shows all eight mascots', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getAllByAltText(/the mascot$/i)).toHaveLength(8)
  })
})
