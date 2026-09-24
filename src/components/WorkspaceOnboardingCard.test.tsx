import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { WorkspaceOnboardingCard } from './WorkspaceOnboardingCard'

describe('WorkspaceOnboardingCard', () => {
  it('requires choosing U8 or U10 before creating, then sends the choice', async () => {
    const createWorkspace = vi.fn().mockResolvedValue(true)
    const access = { checking: false, error: null, signedInEmail: 'bojan.kocijan@digital.ai', lock: vi.fn(), createWorkspace } as unknown as ReturnType<typeof useTrainerAccess>
    render(<WorkspaceOnboardingCard trainerAccess={access} />)
    const submit = screen.getByRole('button', { name: 'Create workspace' })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/U10/))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    await waitFor(() => expect(createWorkspace).toHaveBeenCalledWith('Bojan Kocijan Basketball', 'u10'))
  })
})
