import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { WorkspacePlanEditor } from './WorkspacePlanEditor'

vi.mock('../lib/apiClient', () => ({ api: { patch: vi.fn().mockResolvedValue({}) } }))

const workspace = { id: 'w1', slug: 'basketball-app', name: 'Basketball App', tier: 'free', playerLimit: 15, groupCount: 2, playerCount: 13, staffCount: 1, ownerCount: 1, primaryGroupId: 'u8' }

describe('WorkspacePlanEditor', () => {
  it('saves the chosen plan and player limit', async () => {
    const onSaved = vi.fn()
    render(<WorkspacePlanEditor workspace={workspace} onSaved={onSaved} />)
    fireEvent.change(screen.getByLabelText('Plan'), { target: { value: 'none' } })
    fireEvent.change(screen.getByLabelText('Free player limit'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/workspaces/w1', { tier: null, playerLimit: 30 }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })
})
