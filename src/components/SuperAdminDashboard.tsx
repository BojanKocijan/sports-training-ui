import {
  Building2,
  Layers3,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useAdminOverview } from '../hooks/useAdminOverview'
import { AddOwnerDialog } from './AddOwnerDialog'
import { ThemeToggle } from './ThemeToggle'
import { TrainerAccessMenu } from './TrainerAccessMenu'
import { Button } from './ui/button'

function roleLabel(role: string) {
  if (role === 'club_admin') return 'Club admin'
  if (role === 'co_coach') return 'Co-coach'
  if (role === 'owner') return 'Owner'
  return 'Trainer'
}

function dateLabel(value: string | null) {
  if (!value) return 'Never'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function statusLabel(
  status: 'active' | 'invited' | 'inactive',
) {
  if (status === 'active') return 'Active'
  if (status === 'invited') return 'Invited'
  return 'Inactive'
}

export function SuperAdminDashboard({
  onOpenTrainingApp,
  onLogout,
  onInviteOwner,
}: {
  onOpenTrainingApp: () => void
  onLogout: () => void
  onInviteOwner: (
    email: string,
    groupId: string,
  ) => Promise<void>
}) {
  const {
    overview,
    loading,
    error,
    refresh,
  } = useAdminOverview()

  const [
    ownerWorkspaceId,
    setOwnerWorkspaceId,
  ] = useState<string | null>(null)

  const ownerWorkspace =
    overview?.workspaces.find(
      (workspace) =>
        workspace.id === ownerWorkspaceId,
    ) ?? null

  const stats = overview
    ? [
        {
          label: 'Workspaces',
          value: overview.stats.workspaces,
          icon: Building2,
        },
        {
          label: 'Staff accounts',
          value: overview.stats.staffAccounts,
          icon: Users,
        },
        {
          label: 'Platform admins',
          value: overview.stats.platformAdmins,
          icon: ShieldCheck,
        },
        {
          label: 'Groups',
          value: overview.stats.groups,
          icon: Layers3,
        },
        {
          label: 'Players',
          value: overview.stats.players,
          icon: UserRound,
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Platform administration
            </p>

            <h1 className="text-xl font-bold text-foreground">
              Sports Training
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenTrainingApp}
            >
              Open training app
            </Button>

            <ThemeToggle />

            <TrainerAccessMenu
              kind="trainer"
              accountRole="superadmin"
              onLock={onLogout}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Platform overview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Workspaces, account access and current platform usage.
          </p>
        </div>

        {loading && (
          <p
            role="status"
            className="text-sm text-muted-foreground"
          >
            Loading platform data...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm text-destructive">
              {error}
            </p>

            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void refresh()}
            >
              Try again
            </Button>
          </div>
        )}

        {overview && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(
                ({
                  label,
                  value,
                  icon: Icon,
                }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {label}
                      </span>

                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    <p className="mt-3 text-3xl font-bold text-foreground">
                      {value}
                    </p>
                  </div>
                ),
              )}
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-foreground">
                  Workspaces
                </h2>

                <p className="text-sm text-muted-foreground">
                  Subscription and usage belong to each workspace.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {overview.workspaces.map(
                  (workspace) => (
                    <article
                      key={workspace.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-foreground">
                            {workspace.name}
                          </h3>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {workspace.slug}
                          </p>
                        </div>

                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase text-primary">
                          {workspace.tier ??
                            'No tier'}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-muted p-3">
                          <p className="text-xl font-bold">
                            {
                              workspace.groupCount
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Groups
                          </p>
                        </div>

                        <div className="rounded-xl bg-muted p-3">
                          <p className="text-xl font-bold">
                            {
                              workspace.playerCount
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Players
                          </p>
                        </div>

                        <div className="rounded-xl bg-muted p-3">
                          <p className="text-xl font-bold">
                            {
                              workspace.staffCount
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Staff
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        {workspace.ownerCount >
                        0 ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            Owner assigned
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={
                              !workspace.primaryGroupId
                            }
                            onClick={() =>
                              setOwnerWorkspaceId(
                                workspace.id,
                              )
                            }
                          >
                            Add owner
                          </Button>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-foreground">
                  Account access
                </h2>

                <p className="text-sm text-muted-foreground">
                  Named staff accounts with access to club workspaces.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Role
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Workspace
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Scope
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Added
                      </th>
                      <th className="px-4 py-3 font-semibold">
                        Last sign in
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {overview.access.map(
                      (entry) => (
                        <tr
                          key={`${entry.userId}-${entry.clubId}-${entry.groupId ?? 'club'}`}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            {entry.email ||
                              'Unknown email'}
                          </td>

                          <td className="px-4 py-3">
                            {roleLabel(
                              entry.role,
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {entry.workspace}
                          </td>

                          <td className="px-4 py-3">
                            {entry.groupName ??
                              'All groups'}
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                              {statusLabel(
                                entry.status,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {dateLabel(
                              entry.createdAt,
                            )}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {dateLabel(
                              entry.lastSignInAt,
                            )}
                          </td>
                        </tr>
                      ),
                    )}

                    {overview.access.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No staff accounts assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-foreground">
                  Platform admins
                </h2>

                <p className="text-sm text-muted-foreground">
                  Accounts with platform-wide access.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card">
                {overview.platformAdmins.map(
                  (admin) => (
                    <div
                      key={admin.userId}
                      className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />

                        <div>
                          <p className="font-medium text-foreground">
                            {admin.email ||
                              'Unknown email'}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Platform-wide access
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Added{' '}
                          {dateLabel(
                            admin.createdAt,
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Last sign in{' '}
                          {dateLabel(
                            admin.lastSignInAt,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {ownerWorkspace?.primaryGroupId && (
        <AddOwnerDialog
          open={Boolean(ownerWorkspace)}
          onOpenChange={(open) => {
            if (!open) {
              setOwnerWorkspaceId(null)
            }
          }}
          onInvite={async (email) => {
            const primaryGroupId = ownerWorkspace.primaryGroupId

            if (!primaryGroupId) return

            await onInviteOwner(
              email,
              primaryGroupId,
            )

            setOwnerWorkspaceId(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}
