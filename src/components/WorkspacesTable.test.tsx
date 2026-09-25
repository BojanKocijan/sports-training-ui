import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import type { AdminOverview } from '../hooks/useAdminOverview'
import { INITIAL_TABLE_STATE, pageOfWorkspaces, WorkspacesTable } from './WorkspacesTable'

vi.mock('../lib/apiClient', () => ({ api: { delete: vi.fn() } }))

const make = (n: number) => Array.from({ length: n }, (_, i) => ({
  id: `w${i}`, slug: `club-${i}`, name: `Club ${String(i).padStart(2, '0')}`, tier: 'free',
  groupCount: 1, playerCount: i, staffCount: 1, ownerCount: 1, primaryGroupId: null,
})) as AdminOverview['workspaces']

describe('pageOfWorkspaces', () => {
  it('pages, sorts and filters', () => {
    const all = make(25)
    const first = pageOfWorkspaces(all, INITIAL_TABLE_STATE)
    expect(first.rows).toHaveLength(10)
    expect(first).toMatchObject({ total: 25, page: 0, pageCount: 3 })
    expect(pageOfWorkspaces(all, { ...INITIAL_TABLE_STATE, page: 2 }).rows).toHaveLength(5)
    expect(pageOfWorkspaces(all, { ...INITIAL_TABLE_STATE, page: 99 }).page).toBe(2)
    expect(pageOfWorkspaces(all, { ...INITIAL_TABLE_STATE, sort: 'players', desc: true }).rows[0].name).toBe('Club 24')
    const found = pageOfWorkspaces(all, { ...INITIAL_TABLE_STATE, query: 'club-7' })
    expect(found.rows.map((w) => w.id)).toEqual(['w7'])
  })
})

describe('WorkspacesTable delete action', () => {
  beforeEach(() => {
    vi.mocked(api.delete).mockReset().mockResolvedValue(undefined)
  })

  it('requires typing the workspace name before soft-delete confirmation', async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn().mockResolvedValue(undefined)
    const overview = {
      stats: { workspaces: 1, staffAccounts: 1, platformAdmins: 1, groups: 1, players: 0 },
      workspaces: make(1),
      access: [],
      parents: [],
      platformAdmins: [],
    } as AdminOverview

    render(
      <WorkspacesTable
        overview={overview}
        state={INITIAL_TABLE_STATE}
        onState={vi.fn()}
        onOpen={vi.fn()}
        onDeleted={onDeleted}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Actions for Club 00' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete workspace' }))

    const dialog = screen.getByRole('dialog')
    const confirmation = within(dialog).getByRole('textbox', { name: 'Workspace name' })
    const deleteButton = within(dialog).getByRole('button', { name: 'Delete workspace' })
    expect(deleteButton).toBeDisabled()

    await user.type(confirmation, 'Club 00')
    expect(deleteButton).toBeEnabled()
    await user.click(deleteButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/workspaces/w0', { confirmationName: 'Club 00' })
      expect(onDeleted).toHaveBeenCalledOnce()
    })
  })
})
