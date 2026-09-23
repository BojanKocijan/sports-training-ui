import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LinkedChild } from '../lib/accountSession'
import { ParentHome } from './ParentHome'

vi.mock('./ParentView', () => ({
  ParentView: ({ groupId, player }: { groupId: string; player: { nickname: string } }) => (
    <div data-testid="parent-view">{player.nickname} in {groupId}</div>
  ),
}))

const child = (id: string, nickname: string, group_id: string): LinkedChild => ({
  id, nickname, group_id, jersey_number: null, jersey_color: null, eye_color: null, gender: null, mascot_id: null,
})

describe('ParentHome', () => {
  it('opens a single child straight away, in the child’s own group', () => {
    render(<ParentHome linkedChildren={[child('a', 'Mila', 'u8')]} />)
    expect(screen.getByTestId('parent-view')).toHaveTextContent('Mila in u8')
    expect(screen.queryByText(/all children/i)).not.toBeInTheDocument()
  })

  it('lets a parent of several children pick one and go back', async () => {
    render(<ParentHome linkedChildren={[child('a', 'Mila', 'u8'), child('b', 'Noah', 'u10')]} />)
    expect(screen.queryByTestId('parent-view')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /noah/i }))
    expect(screen.getByTestId('parent-view')).toHaveTextContent('Noah in u10')
    await userEvent.click(screen.getByRole('button', { name: /all children/i }))
    expect(screen.getByRole('heading', { name: /choose a child/i })).toBeInTheDocument()
  })
})
