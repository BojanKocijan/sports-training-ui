/** Shared by CreatePlayerWizard's/SpotlightPlayerEditor's number inputs — an empty or
 * non-numeric string means "not set" (null), not zero. */
export function toIntOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
