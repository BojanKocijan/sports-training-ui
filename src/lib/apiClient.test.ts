import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  vi.stubEnv('VITE_API_URL', ' http://localhost:3002/ ')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('API browser requests', () => {
  it('normalizes the base URL and avoids unnecessary JSON preflights for GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)
    const { api } = await import('./apiClient')
    await expect(api.get('/groups')).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/groups', { headers: {} })
  })

  it.each(['post', 'put', 'delete'] as const)('sends JSON for %s', async (method) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const { api } = await import('./apiClient')
    const body = { passcode: 'test-only' }
    await expect(api[method]('/plans/example', body)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/plans/example', {
      method: method.toUpperCase(), body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  })


  it('sends a parent code only as a header for the selected child, never in the URL', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify([])))
    vi.stubGlobal('fetch', fetchMock)
    const { saveParentCredential } = await import('./parentSession')
    const { api } = await import('./apiClient')
    saveParentCredential({ groupId: 'u8', playerId: 'child', code: 'ABC234' }, false)
    await api.get('/players/child/progress')
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/players/child/progress', {
      headers: { 'X-Parent-Code': 'ABC234' },
    })
    expect(fetchMock.mock.calls[0][0]).not.toContain('ABC234')
    await api.get('/plans?groupId=u8')
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ 'X-Parent-Code': 'ABC234' })
    await api.get('/players/other/progress')
    expect(fetchMock.mock.calls[2][1].headers).not.toHaveProperty('X-Parent-Code')
  })

  it('rejects an empty URL before issuing a request', async () => {
    vi.stubEnv('VITE_API_URL', '   ')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { api, isApiConfigured } = await import('./apiClient')
    expect(isApiConfigured).toBe(false)
    await expect(api.get('/groups')).rejects.toThrow('API is not configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
