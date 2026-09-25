/** Which way the visitor said they are coming in. Kept in localStorage (not just state) so it
 * survives the emailed "Sign in instantly" link opening in a fresh tab. */
export type SignInIntent = 'trainer' | 'parent'
/** New account (sign up, confirmed by email) or an existing one (log in with a code). */
export type AuthMode = 'signup' | 'login'
const KEY = 'coachcub-sign-in-intent'

export function getSignInIntent(): SignInIntent | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'trainer' || value === 'parent' ? value : null
  } catch {
    return null
  }
}

export function setSignInIntent(intent: SignInIntent | null) {
  try {
    if (intent) localStorage.setItem(KEY, intent)
    else localStorage.removeItem(KEY)
  } catch { /* Storage may be disabled. */ }
}
