import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('offers I\'m a trainer and I\'m a parent in the header and opens the matching sign-in', () => {
    render(<LandingPage trainerAccess={access} />)
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('button', { name: /i'm a trainer/i })).toBeInTheDocument()
    fireEvent.click(within(header).getByRole('button', { name: /i'm a parent/i }))
    expect(screen.getByText(/you need to be invited by their trainer/i)).toBeInTheDocument()
    expect(screen.getByText(/one account is both trainer and parent/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('says the audience is youth sports trainers and that only basketball is available now', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByText('For youth sports trainers · Basketball available now')).toBeInTheDocument()
  })

  it('shows basketball as available and more sports as coming soon', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByText(/basketball · available now/i)).toBeInTheDocument()
    expect(screen.getByText(/more coming soon/i)).toBeInTheDocument()
  })

  it('shows the CoachCub logo', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByRole('img', { name: 'CoachCub' })).toBeInTheDocument()
  })

  it('plays the hero video muted and looping with a poster', () => {
    const { container } = render(<LandingPage trainerAccess={access} />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveProperty('loop', true)
    expect(video?.getAttribute('poster')).toBe('/videos/sports-montage-poster.webp')
  })

  it('shows only the poster when the visitor prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const { container } = render(<LandingPage trainerAccess={access} />)
    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByAltText(/animal mascots playing different sports/i)).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('discloses that the characters are AI-generated with illustrator and 3D artist input', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getAllByText(/AI-generated, guided by the experience of an illustrator and a 3D artist/i).length).toBeGreaterThanOrEqual(2)
  })

  it('opens the privacy notice from the footer, even when signed out', async () => {
    render(<LandingPage trainerAccess={access} />)
    await userEvent.click(screen.getByRole('button', { name: /^privacy$/i }))
    expect(screen.getByText(/sign in with an email address too/i)).toBeInTheDocument()
  })

  it('shows all eight mascots', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getAllByAltText(/the mascot$/i)).toHaveLength(8)
  })
})
