import { useState } from "react";
import { useClub } from "../hooks/useClub";
import type { ApiGroup } from "../hooks/useGroups";
import type { AccountRole, TrainerInvite } from "../hooks/useTrainerAccess";
import { GroupMenu } from "./GroupMenu";
import { InviteTrainerDialog } from "./InviteTrainerDialog";
import { PrivacyPolicyScreen } from "./PrivacyPolicyScreen";
import { ThemeToggle } from "./ThemeToggle";
import { TierCatalogDialog } from "./TierCatalogDialog";
import { TrainerAccessMenu } from "./TrainerAccessMenu";
import { Button } from "./ui/button";

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
  trainerAccess,
  onAdminHome,
}: {
  /** Omit pre-unlock — LockScreen has its own group picker for a different purpose (choosing
   * which group to enter). */
  groupSwitcher?: {
    groups: ApiGroup[];
    groupId: string;
    setGroupId: (id: string) => void;
  };
  /** Omit pre-unlock — nothing to log out of yet. Replaces the old per-screen "✓ Trainer access
   * unlocked · Lock" bar with a single top-right avatar + menu. */
  trainerAccess?: {
    kind: "trainer" | "parent";
    lock: () => void;
    /** The signed-in account's email, shown in the account menu (sports-training-ui#222). */
    email?: string;
    canInvite?: boolean;
    inviteTrainer?: (email: string, groupIds?: string[]) => Promise<void>;
    clubId?: string | null;
    fetchTrainerInvites?: (clubId: string) => Promise<TrainerInvite[]>;
    correctTrainerInvite?: (userId: string, clubId: string, email: string) => Promise<unknown>;
    isSuperadmin?: boolean;
    inviteOwner?: (email: string) => Promise<void>;
    accountRole?: AccountRole | null;
    /** Trainer who is also a linked parent: opens their child's parent view. */
    onOpenParentView?: () => void;
    /** Parent view of an account that is also a trainer: back to the trainer app. */
    onSwitchToTrainer?: () => void;
    /** Linked children with their sport, and opening one, for swapping from the avatar. */
    childOptions?: { id: string; label: string }[];
    onOpenChild?: (id: string) => void;
  };
  onAdminHome?: () => void;
}) {
  const club = useClub();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  // Reachable both before and after unlocking a group — a privacy notice shouldn't require a
  // trainer account to read.
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const showLogo = Boolean(club.logoUrl) && failedLogoUrl !== club.logoUrl;

  return (
    <div className="flex items-center justify-between gap-1 border-b border-border bg-card px-2 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-4">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {showLogo ? (
            <img
              src={`${import.meta.env.BASE_URL}${club.logoUrl}`}
              alt={`${club.name} logo`}
              className="h-7 w-7 shrink-0 rounded-full object-contain sm:h-8 sm:w-8"
              onError={() => setFailedLogoUrl(club.logoUrl)}
            />
          ) : (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-8 sm:w-8"
              aria-label={`${club.name} initials`}
            >
              {clubInitials(club.name)}
            </span>
          )}
          <span className="hidden truncate text-sm font-bold uppercase tracking-wide text-foreground sm:inline">
            {club.name}
          </span>
          {club.tier === "free" && !trainerAccess?.isSuperadmin && (
            <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline-flex">
              FREE
            </span>
          )}
        </div>
        {groupSwitcher && (
          <GroupMenu
            groups={groupSwitcher.groups}
            groupId={groupSwitcher.groupId}
            setGroupId={groupSwitcher.setGroupId}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-2">
        {/* List of packages */}
        {/* {!trainerAccess?.isSuperadmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTiersOpen(true)}
            className="px-0 py-0 text-[11px] text-muted-foreground underline-offset-2 hover:bg-transparent hover:underline"
          >
            Packages
          </Button>
        )} */}

        {/* Signed-out visitors have no account menu, so Privacy stays reachable here. */}
        {!trainerAccess && (
          <Button variant="ghost" size="sm" onClick={() => setPrivacyOpen(true)} className="text-muted-foreground">
            Privacy
          </Button>
        )}
        <ThemeToggle />
        {trainerAccess && (
          <TrainerAccessMenu
            kind={trainerAccess.kind}
            accountRole={trainerAccess.accountRole}
            email={trainerAccess.email}
            onLock={trainerAccess.lock}
            onOpenParentView={trainerAccess.onOpenParentView}
            onSwitchToTrainer={trainerAccess.onSwitchToTrainer}
            onAdminHome={trainerAccess.isSuperadmin ? onAdminHome : undefined}
            onInviteTrainer={
              trainerAccess.canInvite && trainerAccess.inviteTrainer ? () => setInviteOpen(true) : undefined
            }
            onOpenPrivacy={() => setPrivacyOpen(true)}
            childOptions={trainerAccess.childOptions}
            onOpenChild={trainerAccess.onOpenChild}
          />
        )}
      </div>
      <TierCatalogDialog open={tiersOpen} onOpenChange={setTiersOpen} />
      {trainerAccess?.inviteTrainer && (
        <InviteTrainerDialog
          tier={club.tier}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={trainerAccess.inviteTrainer}
          clubId={trainerAccess.clubId ?? undefined}
          onLoadInvites={trainerAccess.fetchTrainerInvites}
          onCorrectInvite={trainerAccess.correctTrainerInvite}
          groups={groupSwitcher?.groups ?? []}
          defaultGroupId={groupSwitcher?.groupId}
        />
      )}
      {privacyOpen && (
        <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />
      )}
    </div>
  );
}
