import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { LandingPage } from './LandingPage'

const access = {
  checking: false,
  error: null,
  clearError: vi.fn(),
  requestLoginCode: vi.fn(),
  verifyLoginCode: vi.fn(),
} as unknown as ReturnType<typeof useTrainerAccess>

describe('LandingPage', () => {
  it('opens a trainer / parent chooser from the header Sign in button, then new or existing for that role', () => {
    render(<LandingPage trainerAccess={access} />)
    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByText('How are you coming in?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i'm a trainer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i'm a parent/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /existing trainer/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /i'm a trainer/i }))
    expect(screen.getByRole('button', { name: /new trainer/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new parent/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /existing trainer/i }))
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('goes back from new-or-existing trainer to the trainer / parent chooser', () => {
    render(<LandingPage trainerAccess={access} />)
    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /^sign in$/i }))
    fireEvent.click(screen.getByRole('button', { name: /i'm a trainer/i }))
    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText('How are you coming in?')).toBeInTheDocument()
  })

  it('asks a trainer or parent from the hero whether they are new or existing', () => {
    render(<LandingPage trainerAccess={access} />)
    fireEvent.click(screen.getAllByRole('button', { name: /^i'm a trainer$/i })[0])
    expect(screen.getByRole('button', { name: /new trainer/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new parent/i })).not.toBeInTheDocument()
  })

  it('has one Sign in button in the header and the trainer / parent choice in the hero', () => {
    render(<LandingPage trainerAccess={access} />)
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(within(header).queryByRole('button', { name: /i'm a trainer/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /i'm a parent/i })[0])
    expect(screen.getByText(/their trainer adds your email/i)).toBeInTheDocument()
    expect(screen.getByText(/one account is both trainer and parent/i)).toBeInTheDocument()
    expect(screen.getByText('Existing parent')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new parent/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('says the audience is youth basketball trainers and shows a Basketball available now chip', () => {
    render(<LandingPage trainerAccess={access} />)
    expect(screen.getByText('For youth basketball trainers')).toBeInTheDocument()
    expect(screen.getByText('Basketball available now')).toBeInTheDocument()
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
    expect(video?.getAttribute('poster')).toBe('/videos/sports-montage-v2-poster.webp')
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

  it('closes the sign-in dialog with a Cancel button below the card', () => {
    render(<LandingPage trainerAccess={access} />)
    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    fireEvent.click(cancel)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
