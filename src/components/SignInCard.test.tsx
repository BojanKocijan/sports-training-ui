import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { getSignInIntent } from '../lib/signInIntent'
import { ParentNoChildCard } from './ParentNoChildCard'
import { SignInCard } from './SignInCard'

function access(overrides = {}) {
  return {
    checking: false, error: null, signedInEmail: 'mum@example.com', lock: vi.fn(), refreshAccount: vi.fn(),
    requestSignupCode: vi.fn().mockResolvedValue(true), verifySignupCode: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTrainerAccess>
}

describe('SignInCard', () => {
  it('remembers the chosen role, then requests and verifies a code', async () => {
    const a = access()
    render(<SignInCard trainerAccess={a} />)
    fireEvent.click(screen.getByRole('button', { name: /i'm a trainer/i }))
    expect(getSignInIntent()).toBe('trainer')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'coach@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send sign-in code' }))
    await waitFor(() => expect(a.requestSignupCode).toHaveBeenCalledWith('coach@example.com'))
    fireEvent.change(await screen.findByLabelText('Sign-in code'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(a.verifySignupCode).toHaveBeenCalledWith('coach@example.com', '12345678'))
  })
})

describe('ParentNoChildCard', () => {
  it('offers email, copy and a re-check for a parent with no linked child', () => {
    const a = access()
    render(<ParentNoChildCard trainerAccess={a} onNotParent={vi.fn()} />)
    expect(screen.getByText(/no child linked to mum@example.com yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email the trainer' }).getAttribute('href')).toMatch(/^mailto:/)
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /check again/i }))
    expect(a.refreshAccount).toHaveBeenCalled()
  })
})
