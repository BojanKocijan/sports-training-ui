import { useEffect, useState } from 'react'
import { validSession, saveSession, signOut, type AccountSession } from '../lib/accountSession'
import { api, apiBaseUrl } from '../lib/apiClient'

export function MfaScreen() {
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    validSession(apiBaseUrl).then((session) => {
      if (!session) throw new Error('Session expired')
      return api.post<{ factors: { id: string }[] }>('/auth/mfa/factors', { refreshToken: session.refreshToken })
    })
      .then(({ factors }) => { if (active && factors.length) setFactorId(factors[0].id) })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load MFA') })
    return () => { active = false }
  }, [])

  async function enroll() {
    setBusy(true)
    setError(null)
    try {
      const session = await validSession(apiBaseUrl)
      if (!session) throw new Error('Session expired')
      const data = await api.post<{ factorId: string; qrCode: string; secret: string }>('/auth/mfa/enroll', { refreshToken: session.refreshToken })
      setFactorId(data.factorId)
      setQrCode(data.qrCode)
      setSecret(data.secret)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start MFA')
    } finally { setBusy(false) }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    if (!factorId) return
    setBusy(true)
    setError(null)
    try {
      const session = await validSession(apiBaseUrl)
      if (!session) throw new Error('Session expired')
      const next = await api.post<AccountSession>('/auth/mfa/verify', { refreshToken: session.refreshToken, factorId, code })
      saveSession(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid authenticator code')
    } finally { setBusy(false) }
  }

  return <main className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-card p-6">
    <h1 className="text-xl font-bold">Superadmin verification</h1>
    <p className="mt-2 text-sm text-muted-foreground">Enter a code from your authenticator app to access clubs and trainers.</p>
    {!factorId && <button type="button" disabled={busy} onClick={enroll}
      className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50">Set up authenticator</button>}
    {qrCode && <div className="mt-4">
      <img src={qrCode} alt="Scan this QR code with your authenticator app" className="max-w-full bg-white p-2" />
      {secret && <p className="mt-2 break-all text-xs">Manual setup key: <code>{secret}</code></p>}
    </div>}
    {factorId && <form onSubmit={verify} className="mt-4">
      <label htmlFor="mfa-code" className="block text-sm font-medium">Authenticator code</label>
      <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}"
        value={code} onChange={(event) => setCode(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
      <button type="submit" disabled={busy} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {busy ? 'Verifying…' : 'Verify'}
      </button>
    </form>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    <button type="button" className="mt-5 block text-sm text-muted-foreground underline" onClick={() => { void signOut(apiBaseUrl) }}>Sign out</button>
  </main>
}
