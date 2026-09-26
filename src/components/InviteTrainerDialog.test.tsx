import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('shows trainer invite status and lets an admin correct a pending email', async () => {
    const onLoadInvites = vi.fn()
      .mockResolvedValueOnce([
        { userId: 'pending', email: 'typo@example.com', role: 'trainer', groupIds: ['u8'], status: 'pending', invitedAt: '2026-09-26' },
        { userId: 'confirmed', email: 'coach@example.com', role: 'trainer', groupIds: ['u8'], status: 'confirmed', invitedAt: '2026-09-25' },
      ])
      .mockResolvedValueOnce([])
    const onCorrectInvite = vi.fn().mockResolvedValue(undefined)
    render(<InviteTrainerDialog open onOpenChange={vi.fn()} onInvite={vi.fn()} tier="coach"
      clubId="00000000-0000-4000-8000-000000000001" onLoadInvites={onLoadInvites} onCorrectInvite={onCorrectInvite} />)

    expect(await screen.findByText('typo@example.com')).toBeInTheDocument()
    expect(screen.getByText('coach@example.com')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Correct email' }))
    fireEvent.change(screen.getByLabelText('Correct trainer email'), { target: { value: 'fixed@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save & resend' }))
    await waitFor(() => expect(onCorrectInvite).toHaveBeenCalledWith(
      'pending', '00000000-0000-4000-8000-000000000001', 'fixed@example.com',
    ))
  })
})
