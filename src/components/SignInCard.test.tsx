import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
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
  it('logs in with an emailed code, and can switch role or to sign up', async () => {
    const a = access({ requestLoginCode: vi.fn().mockResolvedValue(true), verifyLoginCode: vi.fn() })
    const onSwitchRole = vi.fn()
    const onSwitchMode = vi.fn()
    render(<SignInCard trainerAccess={a} role="trainer" mode="login" onSwitchRole={onSwitchRole} onSwitchMode={onSwitchMode} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'coach@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send sign-in code' }))
    await waitFor(() => expect(a.requestLoginCode).toHaveBeenCalledWith('coach@example.com'))
    fireEvent.change(await screen.findByLabelText('Sign-in code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(a.verifyLoginCode).toHaveBeenCalledWith('coach@example.com', '123456'))
    fireEvent.click(screen.getByRole('button', { name: /i'm a parent instead/i }))
    expect(onSwitchRole).toHaveBeenCalledWith('parent')
    fireEvent.click(screen.getByRole('button', { name: /i'm a new trainer: sign up/i }))
    expect(onSwitchMode).toHaveBeenCalledWith('signup')
  })

  it('signs a new trainer up with a confirm-by-link email, no code to type', async () => {
    const a = access({ requestSignupCode: vi.fn().mockResolvedValue('sent') })
    render(<SignInCard trainerAccess={a} role="trainer" mode="signup" onSwitchRole={vi.fn()} onSwitchMode={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send confirmation email' }))
    await waitFor(() => expect(a.requestSignupCode).toHaveBeenCalledWith('new@example.com'))
    expect(await screen.findByText(/link expires in 15 minutes/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument()
  })

  it('tells someone who already has an account to log in instead', async () => {
    const a = access({ requestSignupCode: vi.fn().mockResolvedValue('exists'), error: 'We already have an account with this email. Log in instead.' })
    const onSwitchMode = vi.fn()
    render(<SignInCard trainerAccess={a} role="parent" mode="signup" onSwitchRole={vi.fn()} onSwitchMode={onSwitchMode} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'mum@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send confirmation email' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Log in instead' }))
    expect(onSwitchMode).toHaveBeenCalledWith('login')
  })
})

describe('ParentNoChildCard', () => {
  it('offers email, copy and a re-check for a parent with no linked child', () => {
    const a = access()
    render(<ParentNoChildCard trainerAccess={a} onNotParent={vi.fn()} />)
    expect(screen.getByText(/no child linked to mum@example.com yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in my email app' }).getAttribute('href')).toMatch(/^mailto:/)
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument()
    expect(screen.getByLabelText('Message to your trainer').textContent).toMatch(/mum@example\.com/)
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /check again/i }))
    expect(a.refreshAccount).toHaveBeenCalled()
  })
})
