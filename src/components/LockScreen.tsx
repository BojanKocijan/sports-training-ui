import { useState } from 'react'
import { useGroups } from '../hooks/useGroups'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'

/**
 * Gates the entire app: nothing (Setup/Library/Session/Words/Groups content) is reachable
 * without a code for the active group. Same one code field for both trainer and parent codes —
 * useTrainerAccess resolves which kind it was (see sports-training-api#20) and the caller
 * branches into full trainer access or a read-only, single-child ParentView. Picking a group is
 * the one thing that stays open here, since you need to know which group you're in before you
 * know which code to enter. Groups come from GET /groups (the club's actual groups, each an
 * instance of an 'available' or 'coming_soon' template) — not a hardcoded list.
 */
export function LockScreen({
  groupId,
  onSelectGroup,
  trainerAccess,
}: {
  groupId: string
  onSelectGroup: (id: string) => void
  trainerAccess: ReturnType<typeof useTrainerAccess>
}) {
  const { groups, loading: groupsLoading, error: groupsError } = useGroups()
  const { checking, error, tryUnlock } = trainerAccess
  const [codeInput, setCodeInput] = useState('')
  const [rememberCode, setRememberCode] = useState(true)

  const activeGroup = groups.find((g) => g.id === groupId)

  async function handleUnlock() {
    await tryUnlock(codeInput, rememberCode)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col items-center justify-center gap-6 px-4 py-8 md:max-w-lg">
      {groupsLoading ? (
        <p className="text-sm text-neutral-400">Loading groups…</p>
      ) : groupsError ? (
        <p className="text-sm text-red-600">Could not load groups: {groupsError}</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {groups.map((g) => {
            const comingSoon = g.status === 'coming_soon'
            return (
              <button
                key={g.id}
                type="button"
                disabled={comingSoon}
                onClick={() => onSelectGroup(g.id)}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  comingSoon
                    ? 'cursor-not-allowed border-black/10 bg-neutral-100 text-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-600'
                    : g.id === groupId
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
                      : 'border-black/10 bg-white text-neutral-600 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300'
                }`}
              >
                {g.emoji} {g.name}
                {comingSoon && <span className="ml-1 text-[10px]">· soon</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="w-full rounded-3xl bg-white p-5 shadow-lg dark:bg-neutral-900">
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Enter your code</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Enter the {activeGroup?.name ?? groupId} trainer code, or a parent code if a trainer
          gave you one.
        </p>
        <input
          type="password"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="Code"
          autoFocus
          className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-800"
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={rememberCode}
            onChange={(e) => setRememberCode(e.target.checked)}
          />
          Remember this code on this device
        </label>
        {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
        <button
          type="button"
          disabled={checking || !codeInput}
          onClick={handleUnlock}
          className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {checking ? '…' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
