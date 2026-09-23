import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TrainerAccessMenu } from './TrainerAccessMenu'

describe('TrainerAccessMenu', () => {
  it('lets a trainer who is also a parent open the parent view', async () => {
    const onOpenParentView = vi.fn()
    render(<TrainerAccessMenu kind="trainer" accountRole="trainer" onLock={vi.fn()} onOpenParentView={onOpenParentView} />)
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /my children/i }))
    expect(onOpenParentView).toHaveBeenCalled()
  })

  it('lets that account switch back to the trainer view from the parent view', async () => {
    const onSwitchToTrainer = vi.fn()
    render(<TrainerAccessMenu kind="parent" onLock={vi.fn()} onSwitchToTrainer={onSwitchToTrainer} />)
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /back to trainer view/i }))
    expect(onSwitchToTrainer).toHaveBeenCalled()
  })

  it('shows no switch for a plain trainer or a plain parent', async () => {
    render(<TrainerAccessMenu kind="trainer" accountRole="trainer" onLock={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }))
    expect(await screen.findByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /my children|back to trainer/i })).not.toBeInTheDocument()
  })
})
