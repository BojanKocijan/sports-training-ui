import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
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
