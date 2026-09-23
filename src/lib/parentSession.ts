export interface ParentCredential {
  groupId: string
  playerId: string
  code: string
}

const active = new Map<string, ParentCredential>()
const storageKey = (groupId: string) => `sports-training-parent-${groupId}`

export function saveParentCredential(credential: ParentCredential, remember: boolean) {
  // A promoted child may have an old remembered group entry on this device.
  for (const [groupId, previous] of active) {
    if (previous.playerId === credential.playerId && groupId !== credential.groupId) active.delete(groupId)
  }
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('sports-training-parent-') || key === storageKey(credential.groupId)) continue
    try {
      const old = JSON.parse(localStorage.getItem(key) ?? 'null') as { player?: { id?: string } }
      if (old?.player?.id === credential.playerId) localStorage.removeItem(key)
    } catch { /* Ignore old malformed entries. */ }
  }
  active.set(credential.groupId, credential)
  if (remember) {
    localStorage.setItem(storageKey(credential.groupId), JSON.stringify({
      code: credential.code,
      player: { id: credential.playerId },
    }))
  } else {
    localStorage.removeItem(storageKey(credential.groupId))
  }
}

export function clearParentCredential(groupId: string) {
  active.delete(groupId)
  localStorage.removeItem(storageKey(groupId))
}

function stored(groupId: string): ParentCredential | null {
  const current = active.get(groupId)
  if (current) return current
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(groupId)) ?? 'null') as
      { code?: string; player?: { id?: string } } | null
    if (value?.code && value.player?.id) {
      return { groupId, playerId: value.player.id, code: value.code }
    }
  } catch { /* Ignore invalid or unavailable browser storage. */ }
  return null
}

export function parentCredentialForRead(path: string): ParentCredential | null {
  const groupId = path.startsWith('/plans?')
    ? new URLSearchParams(path.slice(path.indexOf('?') + 1)).get('groupId')
    : /^\/groups\/([^/]+)\/progress$/.exec(path)?.[1]
  if (groupId) return stored(decodeURIComponent(groupId))

  const playerId = /^\/players\/([^/]+)\/progress$/.exec(path)?.[1]
  if (!playerId) return null
  const allGroupIds = new Set([
    ...active.keys(),
    ...Object.keys(localStorage)
      .filter((key) => key.startsWith('sports-training-parent-'))
      .map((key) => key.slice('sports-training-parent-'.length)),
  ])
  for (const candidate of allGroupIds) {
    const credential = stored(candidate)
    if (credential?.playerId === decodeURIComponent(playerId)) return credential
  }
  return null
}
