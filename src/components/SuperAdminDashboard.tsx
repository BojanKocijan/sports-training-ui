import {
  Building2,
  Layers3,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useAdminOverview, type AdminOverview } from '../hooks/useAdminOverview'
import { useClub } from '../hooks/useClub'
import { useSportTierLimits } from '../hooks/useSportTierLimits'
import { useTierCatalog } from '../hooks/useTierCatalog'
import { AddOwnerDialog } from './AddOwnerDialog'
import { SportTierLimitsCard } from './SportTierLimitsCard'
import { ThemeToggle } from './ThemeToggle'
import { TierPackagesGrid } from './TierPackagesGrid'
import { INITIAL_TABLE_STATE, WorkspacesTable, type TableState } from './WorkspacesTable'
import { WorkspacePlanEditor } from './WorkspacePlanEditor'
import { TrainerAccessMenu } from './TrainerAccessMenu'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type Access = AdminOverview['access'][number]
type Parent = AdminOverview['parents'][number]

/** Navigation: the platform-wide overview, the workspaces table, sport pricing limits, or one
 * workspace by id. */
const PLATFORM = 'platform'
const WORKSPACES = 'workspaces'
const PRICING = 'pricing'

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

function statusLabel(status: 'active' | 'invited' | 'inactive') {
  if (status === 'active') return 'Active'
  if (status === 'invited') return 'Invited'
  return 'Inactive'
}

const th = 'px-4 py-3 font-semibold'
const td = 'px-4 py-3'
const tdMuted = 'px-4 py-3 text-muted-foreground'
const pill = 'rounded-full bg-muted px-2 py-1 text-xs font-semibold'
const tableWrap = 'overflow-x-auto rounded-2xl border border-border bg-card'
const emptyCell = 'px-4 py-8 text-center text-muted-foreground'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function AdminsTable({ admins }: { admins: AdminOverview['platformAdmins'] }) {
  return (
    <div className={tableWrap}>
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className={th}>Email</th>
            <th className={th}>Access</th>
            <th className={th}>Added</th>
            <th className={th}>Last sign in</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.userId} className="border-b border-border last:border-b-0">
              <td className={`${td} font-medium`}>{admin.email || 'Unknown email'}</td>
              <td className={td}>Platform-wide</td>
              <td className={tdMuted}>{dateLabel(admin.createdAt)}</td>
              <td className={tdMuted}>{dateLabel(admin.lastSignInAt)}</td>
            </tr>
          ))}
          {admins.length === 0 && (
            <tr>
              <td colSpan={4} className={emptyCell}>No platform admins.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TrainersTable({ entries }: { entries: Access[] }) {
  return (
    <div className={tableWrap}>
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className={th}>Email</th>
            <th className={th}>Role</th>
            <th className={th}>Groups</th>
            <th className={th}>Status</th>
            <th className={th}>Added</th>
            <th className={th}>Last sign in</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.userId}-${entry.clubId}-${entry.groupId ?? 'club'}`}
              className="border-b border-border last:border-b-0"
            >
              <td className={`${td} font-medium`}>{entry.email || 'Unknown email'}</td>
              <td className={td}>{roleLabel(entry.role)}</td>
              <td className={td}>{entry.groupName ?? 'All groups'}</td>
              <td className={td}><span className={pill}>{statusLabel(entry.status)}</span></td>
              <td className={tdMuted}>{dateLabel(entry.createdAt)}</td>
              <td className={tdMuted}>{dateLabel(entry.lastSignInAt)}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className={emptyCell}>No trainers assigned yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ParentsTable({ parents }: { parents: Parent[] }) {
  return (
    <div className={tableWrap}>
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className={th}>Email</th>
            <th className={th}>Child</th>
            <th className={th}>Group</th>
            <th className={th}>Status</th>
            <th className={th}>Invited</th>
            <th className={th}>Last sign in</th>
          </tr>
        </thead>
        <tbody>
          {parents.map((parent) => (
            <tr key={parent.linkId} className="border-b border-border last:border-b-0">
              <td className={`${td} font-medium`}>{parent.email}</td>
              <td className={td}>{parent.childName}</td>
              <td className={td}>{parent.groupName ?? '—'}</td>
              <td className={td}>
                <span className={pill}>{parent.status === 'active' ? 'Confirmed' : 'Invited'}</span>
              </td>
              <td className={tdMuted}>{dateLabel(parent.createdAt)}</td>
              <td className={tdMuted}>{dateLabel(parent.lastSignInAt)}</td>
            </tr>
          ))}
          {parents.length === 0 && (
            <tr>
              <td colSpan={6} className={emptyCell}>No parents linked to a child yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** One card for all workspaces: the total, split into Free and Paid (any plan other than Free),
 * opening the Workspaces table. */
function WorkspacesCard({ workspaces, onOpen }: { workspaces: AdminOverview['workspaces']; onOpen: () => void }) {
  const free = workspaces.filter((w) => w.tier === 'free').length
  const paid = workspaces.length - free
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Workspaces: ${workspaces.length} total, ${free} free, ${paid} paid. Open the workspaces table`}
      className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Workspaces</span>
        <Building2 className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-4xl font-bold text-foreground">{workspaces.length}</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span><span className="font-semibold text-foreground">{free}</span> <span className="text-muted-foreground">Free</span></span>
        <span><span className="font-semibold text-foreground">{paid}</span> <span className="text-muted-foreground">Paid</span></span>
      </div>
    </button>
  )
}

export function SuperAdminDashboard({
  onOpenTrainingApp,
  onLogout,
  onInviteOwner,
  onOpenParentView,
  childOptions,
  onOpenChild,
  email,
}: {
  onOpenTrainingApp: () => void
  onLogout: () => void
  onInviteOwner: (email: string, groupId: string) => Promise<void>
  /** Only when the admin's email is also linked to a child: opens their parent view. */
  onOpenParentView?: () => void
  childOptions?: { id: string; label: string }[]
  onOpenChild?: (id: string) => void
  /** The signed-in account's email, shown in the account menu (sports-training-ui#222). */
  email?: string
}) {
  const { overview, loading, error, refresh } = useAdminOverview()
  const club = useClub()
  const { limits, loading: limitsLoading, error: limitsError, refresh: refreshLimits } = useSportTierLimits()
  const { tiers: catalog, loading: catalogLoading, error: catalogError } = useTierCatalog()
  const [selected, setSelected] = useState<string>(PLATFORM)
  const [tableState, setTableState] = useState<TableState>(INITIAL_TABLE_STATE)
  const [ownerWorkspaceId, setOwnerWorkspaceId] = useState<string | null>(null)

  const workspace = overview?.workspaces.find((w) => w.id === selected) ?? null
  const ownerWorkspace = overview?.workspaces.find((w) => w.id === ownerWorkspaceId) ?? null

  const stats = overview
    ? [
        { label: 'Staff accounts', value: overview.stats.staffAccounts, icon: Users },
        { label: 'Platform admins', value: overview.stats.platformAdmins, icon: ShieldCheck },
        { label: 'Groups', value: overview.stats.groups, icon: Layers3 },
        { label: 'Players', value: overview.stats.players, icon: UserRound },
      ]
    : []

  const navItem = (active: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Platform administration
            </p>
            <h1 className="text-xl font-bold text-foreground">CoachCub</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenTrainingApp}>
              {/* Today there's only ever one workspace to open — names it so it's never a
               * surprise, ahead of sports-training-api#112 letting a superadmin reach several. */}
              Open training app → {club.name}
            </Button>
            <ThemeToggle />
            <TrainerAccessMenu kind="trainer" accountRole="superadmin" email={email} onLock={onLogout} onOpenParentView={onOpenParentView} childOptions={childOptions} onOpenChild={onOpenChild} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav aria-label="Admin sections" className="shrink-0 md:w-60">
          <button
            type="button"
            aria-current={selected === PLATFORM ? 'page' : undefined}
            onClick={() => setSelected(PLATFORM)}
            className={navItem(selected === PLATFORM)}
          >
            <span>Platform overview</span>
          </button>

          <button
            type="button"
            aria-current={selected === WORKSPACES || workspace ? 'page' : undefined}
            onClick={() => setSelected(WORKSPACES)}
            className={`${navItem(selected === WORKSPACES || Boolean(workspace))} mt-1`}
          >
            <span>Workspaces</span>
            {overview && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{overview.workspaces.length}</span>}
          </button>

          <button
            type="button"
            aria-current={selected === PRICING ? 'page' : undefined}
            onClick={() => setSelected(PRICING)}
            className={`${navItem(selected === PRICING)} mt-1`}
          >
            <span>Pricing & limits</span>
          </button>
        </nav>

        <main className="min-w-0 flex-1 space-y-8">
          {loading && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading platform data...
            </p>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refresh()}>
                Try again
              </Button>
            </div>
          )}

          {overview && selected === PLATFORM && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Platform overview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current platform usage. Open Workspaces for the full list.
                </p>
              </div>

              <WorkspacesCard workspaces={overview.workspaces} onOpen={() => setSelected(WORKSPACES)} />

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </section>

              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-foreground">Platform admins</h2>
                  <p className="text-sm text-muted-foreground">Accounts with platform-wide access.</p>
                </div>
                <AdminsTable admins={overview.platformAdmins} />
              </section>
            </>
          )}

          {selected === PRICING && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Pricing & limits</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Default seat caps by sport and tier. A workspace's own override (set from its Plan tab) takes precedence over these.
                </p>
              </div>

              {limitsLoading && (
                <p role="status" className="text-sm text-muted-foreground">Loading pricing limits...</p>
              )}

              {limitsError && (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{limitsError}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refreshLimits()}>
                    Try again
                  </Button>
                </div>
              )}

              {limits && <SportTierLimitsCard limits={limits} onSaved={refreshLimits} />}

              <section>
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground">What each tier includes</h3>
                  <p className="text-sm text-muted-foreground">
                    Everything decided so far per tier — pricing, status, and features (sharing, inviting, org admin). Free is live; the rest are planned.
                  </p>
                </div>

                {catalogLoading && (
                  <p role="status" className="text-sm text-muted-foreground">Loading tier catalog...</p>
                )}

                {catalogError && (
                  <p role="alert" className="text-sm text-destructive">{catalogError}</p>
                )}

                {catalog && <TierPackagesGrid tiers={catalog} />}
              </section>
            </>
          )}

          {overview && selected === WORKSPACES && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Workspaces</h2>
                <p className="mt-1 text-sm text-muted-foreground">Open a workspace for its plan, groups and people.</p>
              </div>
              <WorkspacesTable overview={overview} state={tableState} onState={setTableState} onOpen={setSelected} onDeleted={refresh} />
            </>
          )}

          {overview && workspace && (
            <>
              <button type="button" onClick={() => setSelected(WORKSPACES)} className="text-sm text-muted-foreground hover:underline">
                ← Workspaces
              </button>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{workspace.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workspace.slug} ·{' '}
                    <span className="font-semibold uppercase text-primary">{workspace.tier ?? 'No tier'}</span>
                  </p>
                </div>
                {workspace.ownerCount > 0 ? (
                  <span className="text-xs font-medium text-muted-foreground">Owner assigned</span>
                ) : (
                  <Button
                    size="sm"
                    disabled={!workspace.primaryGroupId}
                    onClick={() => setOwnerWorkspaceId(workspace.id)}
                  >
                    Add owner
                  </Button>
                )}
              </div>

              <WorkspacePlanEditor key={workspace.id + workspace.tier + workspace.playerLimit} workspace={workspace} onSaved={() => void refresh()} />

              <section className="grid grid-cols-3 gap-3">
                <StatTile label="Groups" value={workspace.groupCount} />
                <StatTile label="Players" value={workspace.playerCount} />
                <StatTile label="Staff" value={workspace.staffCount} />
              </section>

              {workspace.groups && workspace.groups.length > 0 && (
                <section>
                  <h3 className="mb-3 text-lg font-bold text-foreground">Groups</h3>
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {workspace.groups.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{g.name}</span>
                        <span className="text-muted-foreground">
                          {g.playerCount} {g.playerCount === 1 ? 'player' : 'players'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground">People</h3>
                  <p className="text-sm text-muted-foreground">
                    Trainers and parents in {workspace.name}.
                  </p>
                </div>
                <WorkspacePeople overview={overview} workspaceId={workspace.id} />
              </section>
            </>
          )}
        </main>
      </div>

      {ownerWorkspace?.primaryGroupId && (
        <AddOwnerDialog
          open={Boolean(ownerWorkspace)}
          onOpenChange={(open) => {
            if (!open) setOwnerWorkspaceId(null)
          }}
          onInvite={async (email) => {
            const primaryGroupId = ownerWorkspace.primaryGroupId
            if (!primaryGroupId) return
            await onInviteOwner(email, primaryGroupId)
            setOwnerWorkspaceId(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

function WorkspacePeople({ overview, workspaceId }: { overview: AdminOverview; workspaceId: string }) {
  const trainers = overview.access.filter((entry) => entry.clubId === workspaceId)
  const parents = overview.parents.filter((parent) => parent.clubId === workspaceId)

  return (
    <Tabs defaultValue="trainers">
      <TabsList>
        <TabsTrigger value="trainers">Trainers ({trainers.length})</TabsTrigger>
        <TabsTrigger value="parents">Parents ({parents.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="trainers">
        <TrainersTable entries={trainers} />
      </TabsContent>
      <TabsContent value="parents">
        <ParentsTable parents={parents} />
      </TabsContent>
    </Tabs>
  )
}
