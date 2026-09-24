import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InviteTrainerDialog } from './InviteTrainerDialog'

describe('InviteTrainerDialog', () => {
  it('explains why a trainer cannot be invited on the Free plan', () => {
    render(<InviteTrainerDialog open onOpenChange={vi.fn()} onInvite={vi.fn()} tier="free" />)
    expect(screen.getByText(/can't invite another trainer on the Free plan/i)).toBeTruthy()
    expect(screen.queryByLabelText(/trainer email/i)).toBeNull()
  })

  it('shows the invite form on a paid workspace', () => {
    render(<InviteTrainerDialog open onOpenChange={vi.fn()} onInvite={vi.fn()} tier={null} />)
    expect(screen.getByLabelText(/trainer email/i)).toBeTruthy()
  })
})
