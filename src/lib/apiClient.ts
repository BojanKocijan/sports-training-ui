import { validSession } from './accountSession'
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, '')

/** True once VITE_API_URL is set (see .env.example) — points at a sports-training-api deployment. */
export const isApiConfigured = Boolean(API_URL)
export const apiBaseUrl = API_URL ?? ''

export class ApiRequestError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new ApiRequestError('API is not configured')
  const publicAuth = ['/auth/request-code', '/auth/verify-code', '/auth/refresh'].includes(path)
  const session = publicAuth ? null : await validSession(API_URL)
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiRequestError(body?.error ?? `Request failed with status ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
}
