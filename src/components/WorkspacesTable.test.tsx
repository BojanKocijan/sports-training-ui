import { describe, expect, it } from 'vitest'
import type { AdminOverview } from '../hooks/useAdminOverview'
import { INITIAL_TABLE_STATE, pageOfWorkspaces } from './WorkspacesTable'

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
