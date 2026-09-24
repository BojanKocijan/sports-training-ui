/** Suggested workspace name for a new sign-up, from the email's local part:
 * "bojan.kocijan@digital.ai" -> "Bojan Kocijan Basketball". Best effort and always editable. */
export function suggestWorkspaceName(email: string): string {
  const local = email.split('@')[0] ?? ''
  const words = local
    .split(/[._\-+]+/)
    .map((w) => w.replace(/\d+/g, ''))
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  return words.length > 0 ? `${words.join(' ')} Basketball` : 'My Basketball Team'
}
