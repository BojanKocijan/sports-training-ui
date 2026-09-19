import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import {
  fetchParentCode,
  issueParentCode,
  ratePlayerProgress,
  revokeParentCode,
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
      'trainer-code',
      'player-1',
      'plan-u8-1',
      'dribbling',
      3,
    )

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith('/players/player-1/progress', {
      passcode: 'trainer-code',
      planId: 'plan-u8-1',
      categoryId: 'dribbling',
      rating: 3,
    })
  })

  it('fetches the current parent code using trainer credentials', async () => {
    postMock.mockResolvedValueOnce({
      parentCode: 'PARENT-123',
    })

    const code = await fetchParentCode('trainer code & symbols', 'player-1')

    expect(code).toBe('PARENT-123')
    expect(postMock).toHaveBeenCalledWith('/players/player-1/parent-code/read', {
      passcode: 'trainer code & symbols',
    })
    expect(api.get).not.toHaveBeenCalled()
    expect(postMock.mock.calls.some(([path]) => path.includes('passcode='))).toBe(false)
  })

  it('returns null when the player has no parent code', async () => {
    postMock.mockResolvedValueOnce({
      parentCode: null,
    })

    await expect(
      fetchParentCode('trainer-code', 'player-1'),
    ).resolves.toBeNull()
  })

  it('issues a fresh parent code', async () => {
    postMock.mockResolvedValueOnce({
      parentCode: 'PARENT-456',
    })

    const code = await issueParentCode('trainer-code', 'player-1')

    expect(code).toBe('PARENT-456')
    expect(postMock).toHaveBeenCalledWith('/players/player-1/parent-code', {
      passcode: 'trainer-code',
    })
  })

  it('revokes a parent code', async () => {
    deleteMock.mockResolvedValueOnce(undefined)

    await revokeParentCode('trainer-code', 'player-1')

    expect(deleteMock).toHaveBeenCalledWith('/players/player-1/parent-code', {
      passcode: 'trainer-code',
    })
  })
})
