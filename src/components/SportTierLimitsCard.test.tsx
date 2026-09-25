import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { SportTierLimitsCard } from './SportTierLimitsCard'

vi.mock('../lib/apiClient', () => ({ api: { patch: vi.fn().mockResolvedValue({}) } }))

const limits = [
  { sportId: 'basketball', tier: 'free', maxPlayers: 15, updatedAt: '2026-09-25T00:00:00Z' },
]

describe('SportTierLimitsCard', () => {
  it('groups limits by sport and saves an updated default', async () => {
    const onSaved = vi.fn()
    render(<SportTierLimitsCard limits={limits} onSaved={onSaved} />)

    expect(screen.getByRole('heading', { name: 'Basketball' })).toBeInTheDocument()
    const input = screen.getByLabelText('Basketball Free trial max players')
    expect(input).toHaveValue(15)

    fireEvent.change(input, { target: { value: '16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/admin/sport-tier-limits/basketball/free', { maxPlayers: 16 }),
    )
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  it('shows a message when there are no configured limits', () => {
    render(<SportTierLimitsCard limits={[]} onSaved={vi.fn()} />)
    expect(screen.getByText('No sport pricing limits configured yet.')).toBeInTheDocument()
  })
})
