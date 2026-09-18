import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { api, isApiConfigured } from '../lib/apiClient'

/** A {left, top, width, height} box as fractions (0-1) of the avatar's base image, for CSS
 * absolute positioning of a mask/overlay layer on top of it. Shared shape across every layout
 * column below (see sports-training-api#57/#59). */
export interface AvatarLayoutBox {
  left: number
  top: number
  width: number
  height: number
}

export interface MascotAvatar {
  id: string
  mascot_id: string
  sport_id: string
  stage: string
  jersey_color: string | null
  image_url: string
  /** Present only on 'baby'-stage dynamic rows (sports-training-api#57/#59) -- absent (null)
   * on every legacy per-color row, which is what JerseyGraphic uses to pick which rendering
   * path applies. */
  gender: 'boy' | 'girl' | null
  /** URL template with a literal `{color}` placeholder the client substitutes with the
   * player's chosen jersey color (e.g. '.../leon-baby-jersey-{color}.svg' -> '...-red.svg'). */
  jersey_mask_url: string | null
  jersey_layout: AvatarLayoutBox | null
  /** Same template shape as jersey_mask_url, substituted with the eye color instead. */
  eyes_mask_url: string | null
  eyes_layout: AvatarLayoutBox | null
  number_layout: AvatarLayoutBox | null
  logo_layout: AvatarLayoutBox | null
}

interface MascotAvatarsSnapshot {
  avatars: MascotAvatar[]
  loading: boolean
  updatedAt: number
}

interface MascotAvatarsCacheEntry {
  snapshot: MascotAvatarsSnapshot
  inflight: Promise<MascotAvatar[]> | null
  listeners: Set<() => void>
}

// Artwork per group barely ever changes -- a much longer TTL than usePlans' is fine, and keeps
// a roster grid of many JerseyGraphic cards (all resolving the same group's avatars) from
// re-fetching on every remount.
const CACHE_TTL_MS = 5 * 60_000

const cacheByGroup = new Map<string, MascotAvatarsCacheEntry>()

function getCacheEntry(groupId: string): MascotAvatarsCacheEntry {
  let entry = cacheByGroup.get(groupId)

  if (!entry) {
    entry = {
      snapshot: { avatars: [], loading: isApiConfigured, updatedAt: 0 },
      inflight: null,
      listeners: new Set(),
    }

    cacheByGroup.set(groupId, entry)
  }

  return entry
}

function emit(entry: MascotAvatarsCacheEntry) {
  entry.listeners.forEach((listener) => listener())
}

function isCacheFresh(entry: MascotAvatarsCacheEntry) {
  return entry.snapshot.updatedAt > 0 && Date.now() - entry.snapshot.updatedAt < CACHE_TTL_MS
}

async function fetchMascotAvatars(groupId: string): Promise<MascotAvatar[]> {
  const entry = getCacheEntry(groupId)

  if (isCacheFresh(entry)) return entry.snapshot.avatars
  if (entry.inflight) return entry.inflight

  if (entry.snapshot.avatars.length === 0) {
    entry.snapshot = { ...entry.snapshot, loading: true }
    emit(entry)
  }

  entry.inflight = api
    .get<MascotAvatar[]>(`/mascots/avatars?groupId=${encodeURIComponent(groupId)}`)
    .then((avatars) => {
      entry.snapshot = { avatars, loading: false, updatedAt: Date.now() }
      emit(entry)
      return avatars
    })
    .catch(() => {
      // No dedicated error state -- callers fall back to a default rendering when the list is
      // empty, same as "this stage has no seeded art yet" (see mascots.ts's own [] response).
      entry.snapshot = { ...entry.snapshot, loading: false }
      emit(entry)
      return entry.snapshot.avatars
    })
    .finally(() => {
      entry.inflight = null
    })

  return entry.inflight
}

function subscribe(groupId: string, listener: () => void) {
  const entry = getCacheEntry(groupId)
  entry.listeners.add(listener)
  return () => entry.listeners.delete(listener)
}

function getSnapshot(groupId: string) {
  return getCacheEntry(groupId).snapshot
}

/** A group's resolved mascot artwork (sport + age stage, see sports-training-api#49/#52) —
 * shared/cached per group so a roster grid's worth of JerseyGraphic cards, all resolving the
 * same group, cost one request instead of one per card. Empty `avatars` means no dedicated art
 * exists for this group's stage yet (not an error) -- callers fall back to their own default. */
export function useMascotAvatars(groupId: string) {
  const subscribeToGroup = useCallback(
    (listener: () => void) => subscribe(groupId, listener),
    [groupId],
  )
  const getGroupSnapshot = useCallback(() => getSnapshot(groupId), [groupId])

  const { avatars, loading } = useSyncExternalStore(subscribeToGroup, getGroupSnapshot, getGroupSnapshot)

  useEffect(() => {
    // Empty groupId means "no group context yet" (e.g. a live preview before a player is
    // assigned one) -- nothing to resolve, and definitely not a real API call.
    if (!isApiConfigured || !groupId) return
    void fetchMascotAvatars(groupId)
  }, [groupId])

  return { avatars, loading }
}
