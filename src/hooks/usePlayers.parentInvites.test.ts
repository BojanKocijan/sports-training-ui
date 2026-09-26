import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { updateParentLink } from './usePlayers'

vi.mock('../lib/apiClient', () => ({ api: { put: vi.fn() } }))

describe('parent invitation recovery actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('corrects a pending parent email using the player-scoped endpoint', async () => {
    const link = { id: 'link-1', email: 'fixed@example.com', confirmed_at: null, created_at: '2026-09-26' }
    vi.mocked(api.put).mockResolvedValue({ link, invited: true })
    await expect(updateParentLink('player-1', 'link-1', 'fixed@example.com')).resolves.toEqual(link)
    expect(api.put).toHaveBeenCalledWith('/players/player-1/parents/link-1', { email: 'fixed@example.com' })
  })
})
