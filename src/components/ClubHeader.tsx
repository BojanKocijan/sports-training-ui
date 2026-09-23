import { useState } from "react";
import { useClub } from "../hooks/useClub";
import type { ApiGroup } from "../hooks/useGroups";
import type { AccountRole } from "../hooks/useTrainerAccess";
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
    canInvite?: boolean;
    inviteTrainer?: (email: string) => Promise<void>;
    isSuperadmin?: boolean;
    inviteOwner?: (email: string) => Promise<void>;
    accountRole?: AccountRole | null;
    /** Trainer who is also a linked parent: opens their child's parent view. */
    onOpenParentView?: () => void;
    /** Parent view of an account that is also a trainer: back to the trainer app. */
    onSwitchToTrainer?: () => void;
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
    <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
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
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              aria-label={`${club.name} initials`}
            >
              {clubInitials(club.name)}
            </span>
          )}
          <span className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {club.name}
          </span>
          {club.tier === "free" && !trainerAccess?.isSuperadmin && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
      <div className="flex shrink-0 items-center gap-3">
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

        {trainerAccess?.isSuperadmin && onAdminHome && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdminHome}
          >
            Admin dashboard
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPrivacyOpen(true)}
          className="px-0 py-0 text-[11px] text-muted-foreground underline-offset-2 hover:bg-transparent hover:underline"
        >
          Privacy
        </Button>
        {club.tier !== "free" &&
          !trainerAccess?.isSuperadmin &&
          trainerAccess?.canInvite &&
          trainerAccess.inviteTrainer && (
          <Button variant="ghost" size="sm" onClick={() => setInviteOpen(true)}>
            Invite trainer
          </Button>
        )}
        <ThemeToggle />
        {trainerAccess && (
          <TrainerAccessMenu
            kind={trainerAccess.kind}
            accountRole={trainerAccess.accountRole}
            onLock={trainerAccess.lock}
            onOpenParentView={trainerAccess.onOpenParentView}
            onSwitchToTrainer={trainerAccess.onSwitchToTrainer}
          />
        )}
      </div>
      <TierCatalogDialog open={tiersOpen} onOpenChange={setTiersOpen} />
      {club.tier !== "free" && trainerAccess?.inviteTrainer && (
        <InviteTrainerDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={trainerAccess.inviteTrainer}
        />
      )}
      {privacyOpen && (
        <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />
      )}
    </div>
  );
}
