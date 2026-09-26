import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InviteStatusBadge } from './InviteStatusBadge'

describe('InviteStatusBadge', () => {
  it('shows pending and confirmed invitation states', () => {
    const { rerender } = render(<InviteStatusBadge confirmed={false} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    rerender(<InviteStatusBadge confirmed />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })
})
