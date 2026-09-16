import { useState } from "react";
import { useClub } from "../hooks/useClub";
import type { ApiGroup } from "../hooks/useGroups";
import { GroupMenu } from "./GroupMenu";
import { PrivacyPolicyScreen } from "./PrivacyPolicyScreen";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/Button";

function clubInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "C"
  );
}

export function ClubHeader({
  groupSwitcher,
}: {
  /** Omit pre-unlock — LockScreen has its own group picker for a different purpose (choosing
   * which group's passcode to enter). */
  groupSwitcher?: {
    groups: ApiGroup[];
    groupId: string;
    setGroupId: (id: string) => void;
  };
}) {
  const club = useClub();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  // Reachable both before and after unlocking a group — a privacy notice shouldn't require a
  // trainer passcode to read.
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const showLogo = Boolean(club.logoUrl) && failedLogoUrl !== club.logoUrl;

  return (
    <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-white px-4 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] dark:border-white/10 dark:bg-neutral-950">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {showLogo ? (
            <img
              src={`${import.meta.env.BASE_URL}${club.logoUrl}`}
              alt={`${club.name} logo`}
              className="h-6 w-6 shrink-0 rounded-full object-contain"
              onError={() => setFailedLogoUrl(club.logoUrl)}
            />
          ) : (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white"
              aria-label={`${club.name} initials`}
            >
              {clubInitials(club.name)}
            </span>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPrivacyOpen(true)}
          className="px-0 py-0 text-[11px] text-neutral-400 underline-offset-2 hover:bg-transparent hover:underline dark:text-neutral-500 dark:hover:bg-transparent"
        >
          Privacy
        </Button>
        <ThemeToggle />
      </div>
      {privacyOpen && (
        <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />
      )}
    </div>
  );
}
