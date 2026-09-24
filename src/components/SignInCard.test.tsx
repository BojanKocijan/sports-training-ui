import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { SignInCard } from './SignInCard'

function access(overrides = {}) {
  return {
    checking: false, error: null,
    requestLoginCode: vi.fn().mockResolvedValue(true), verifyLoginCode: vi.fn(),
    requestSignupCode: vi.fn().mockResolvedValue(true), verifySignupCode: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTrainerAccess>
}

describe('SignInCard sign-up', () => {
  it('sends a sign-up code, then verifies it with the (suggested) workspace name', async () => {
    const a = access()
    render(<SignInCard trainerAccess={a} />)
    fireEvent.click(screen.getByRole('button', { name: /new here\? create a workspace/i }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bojan.kocijan@digital.ai' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send sign-up code' }))
    await waitFor(() => expect(a.requestSignupCode).toHaveBeenCalledWith('bojan.kocijan@digital.ai'))
    fireEvent.change(await screen.findByLabelText('Sign-in code'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }))
    await waitFor(() => expect(a.verifySignupCode).toHaveBeenCalledWith('bojan.kocijan@digital.ai', '12345678', 'Bojan Kocijan Basketball'))
    expect(a.requestLoginCode).not.toHaveBeenCalled()
  })
})
