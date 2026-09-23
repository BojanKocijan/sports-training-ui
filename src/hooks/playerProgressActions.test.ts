import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import {
  addParentLink,
  fetchParentLinks,
  ratePlayerProgress,
  removeParentLink,
} from './usePlayers'

vi.mock('../lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  isApiConfigured: true,
}))

const postMock = vi.mocked(api.post)
const deleteMock = vi.mocked(api.delete)

describe('player progress actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs a player rating for a specific training and skill category', async () => {
    postMock.mockResolvedValueOnce(undefined)

    await ratePlayerProgress(
      'player-1',
      'plan-u8-1',
      'dribbling',
      3,
    )

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith('/players/player-1/progress', {
      planId: 'plan-u8-1',
      categoryId: 'dribbling',
      rating: 3,
    })
  })

  it('lists the parent emails linked to a player', async () => {
    const links = [{ id: 'l1', email: 'mum@example.com', confirmed_at: null, created_at: '2026-09-23T10:00:00Z' }]
    vi.mocked(api.get).mockResolvedValueOnce(links)

    expect(await fetchParentLinks('player-1')).toEqual(links)
    expect(api.get).toHaveBeenCalledWith('/players/player-1/parents')
  })

  it('links a parent email and returns the new link', async () => {
    const link = { id: 'l1', email: 'mum@example.com', confirmed_at: null, created_at: '2026-09-23T10:00:00Z' }
    postMock.mockResolvedValueOnce({ link, invited: true })

    expect(await addParentLink('player-1', 'mum@example.com')).toEqual(link)
    expect(postMock).toHaveBeenCalledWith('/players/player-1/parents', { email: 'mum@example.com' })
  })

  it('unlinks a parent email', async () => {
    deleteMock.mockResolvedValueOnce(undefined)

    await removeParentLink('player-1', 'l1')

    expect(deleteMock).toHaveBeenCalledWith('/players/player-1/parents/l1')
  })
})
