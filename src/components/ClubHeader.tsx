import { useState } from 'react'
import { useClub } from '../hooks/useClub'
import type { ApiGroup } from '../hooks/useGroups'
import { DEFAULT_SPORT_ID, sportInfo } from '../data/sports'
import { GroupMenu } from './GroupMenu'
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen'
import { ThemeToggle } from './ThemeToggle'

export function ClubHeader({
  groupSwitcher,
}: {
  /** Omit pre-unlock — LockScreen has its own group picker for a different purpose (choosing
   * which group's passcode to enter). */
  groupSwitcher?: { groups: ApiGroup[]; groupId: string; setGroupId: (id: string) => void }
}) {
  const club = useClub()
  const [logoFailed, setLogoFailed] = useState(false)
  // Reachable both before and after unlocking a group — a privacy notice shouldn't require a
  // trainer passcode to read.
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-white px-4 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] dark:border-white/10 dark:bg-neutral-950">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {club.logoUrl && !logoFailed ? (
            <img
              src={`${import.meta.env.BASE_URL}${club.logoUrl}`}
              alt={`${club.name} logo`}
              className="h-6 w-6 shrink-0 rounded-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="shrink-0 text-base leading-none">{sportInfo(DEFAULT_SPORT_ID).emoji}</span>
          )}
          <span className="truncate text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {club.name}
          </span>
        </div>
        {groupSwitcher && (
          <GroupMenu
            groups={groupSwitcher.groups}
            groupId={groupSwitcher.groupId}
            setGroupId={groupSwitcher.setGroupId}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className="text-[11px] font-semibold text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
        >
          Privacy
        </button>
        <ThemeToggle />
      </div>
      {privacyOpen && <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}
