import { useEffect, useMemo, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { ClubHeader } from './components/ClubHeader'
import { ExercisesScreen } from './components/ExercisesScreen'
import { GroupsScreen } from './components/GroupsScreen'
import { LandingPage } from './components/LandingPage'
import { ParentHome } from './components/ParentHome'
import { PlayerDetailScreen } from './components/PlayerDetailScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { SessionScreen } from './components/SessionScreen'
import { SuperAdminDashboard } from './components/SuperAdminDashboard'
import { SideNav } from './components/SideNav'
import { useActiveGroup } from './hooks/useActiveGroup'
import { useActivePlan } from './hooks/useActivePlan'
import { findExercise, useExercises } from './hooks/useExercises'
import { useGroups } from './hooks/useGroups'
import { usePlans } from './hooks/usePlans'
import { type EyeColor, type Gender, type JerseyColor, usePlayers } from './hooks/usePlayers'
import { useSportTheme } from './hooks/useSportTheme'
import { useTrainerAccess } from './hooks/useTrainerAccess'
import { getSignInIntent, setSignInIntent } from './lib/signInIntent'
import { ParentNoChildDialog } from './components/ParentNoChildDialog'
import { childOptions as buildChildOptions } from './utils/childOptions'
import { formatDate } from './utils/format'

function App() {
  const [tab, setTab] = useState<Tab>('groups')
  // A trainer whose email is also linked to a child can flip to that child's parent view.
  const [openChildId, setOpenChildId] = useState<string | null>(null)
  const [asParent, setAsParentState] = useState(() => {
    try { return sessionStorage.getItem('view-as-parent') === '1' } catch { return false }
  })
  const setAsParent = (value: boolean) => {
    setAsParentState(value)
    try { sessionStorage.setItem('view-as-parent', value ? '1' : '0') } catch { /* Storage may be disabled. */ }
  }
  const [superadminView, setSuperadminView] =
    useState<'dashboard' | 'training'>('dashboard')
  const activePlan = useActivePlan()
  const { groupId, setGroupId } = useActiveGroup()
  const { groups } = useGroups()
  const { exercises } = useExercises()
  const { plans, nextPlan, refresh: refreshPlans } = usePlans(groupId)
  const activeGroup = groups.find((group) => group.id === groupId)
  const groupTemplateId = activeGroup?.templateId ?? groupId
  const groupTemplateLabel = activeGroup?.templateLabel ?? groupTemplateId.toUpperCase()
  useSportTheme(activeGroup?.sportAccentColor)
  // Owned here, not inside PlayersSection, so PlayerDetailScreen (a sibling top-level screen, see
  // below) can use the same roster data and mutations without a second fetch.
  const {
    players,
    loading: playersLoading,
    error: playersError,
    refresh: refreshPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
  } = usePlayers(groupId)
  // The signed-in trainer's membership is scoped to the active group.
  const trainerAccess = useTrainerAccess(groupId)
  const childOptions = buildChildOptions(trainerAccess.children, groups)
  // Where the person said they were coming in (trainer or parent) vs what the account is (#roles).
  // A parent login on an account with no child but a trainer/admin role gets an explanation, not the
  // trainer app; a parent login with a child lands in the parent view. The avatar menu switches.
  const [parentMismatchAcknowledged, setParentMismatchAcknowledged] = useState(false)
  const parentMismatch =
    trainerAccess.unlocked && getSignInIntent() === 'parent' && !parentMismatchAcknowledged &&
    !trainerAccess.roles.parent && (trainerAccess.roles.trainer || trainerAccess.roles.admin)
  useEffect(() => {
    if (trainerAccess.unlocked && getSignInIntent() === 'parent' && trainerAccess.roles.parent) {
      setAsParent(true)
      setSignInIntent(null)
    }
    // Only when the account or its children change, not on every asParent toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerAccess.unlocked, trainerAccess.roles.parent])
  const childLabels = Object.fromEntries(childOptions.map((c) => [c.id, c.label]))
  const openChild = (id: string) => { setOpenChildId(id); setAsParent(true) }

  useEffect(() => {
    if (!trainerAccess.unlocked) {
      setSuperadminView('dashboard')
    }
  }, [trainerAccess.unlocked])

  useEffect(() => {
    if (!trainerAccess.unlocked && trainerAccess.groupIds.length > 0 && !trainerAccess.groupIds.includes(groupId)) {
      setGroupId(trainerAccess.groupIds[0])
    }
  }, [groupId, setGroupId, trainerAccess.groupIds, trainerAccess.unlocked])

  useEffect(() => {
    if (trainerAccess.kind === 'trainer') void refreshPlayers()
  }, [trainerAccess.kind, refreshPlayers])

  useEffect(() => {
    if (trainerAccess.unlocked) void refreshPlans().catch(() => {
      // The shared plans hook surfaces read failures on the relevant screen.
    })
  }, [trainerAccess.unlocked, refreshPlans])

  // Which player's detail screen is open, if any. Lifted up here instead of living inside
  // PlayersSection so it renders as a real sibling screen that replaces the trainer layout
  // outright, not a `fixed inset-0` overlay stacked on top of it while that layout stays mounted
  // (and scrolled) underneath — that's what caused the scroll glitches (see #73).
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null)
  const viewingPlayer = players.find((p) => p.id === viewingPlayerId) ?? null
  const [savingPlayer, setSavingPlayer] = useState(false)
  const [savePlayerError, setSavePlayerError] = useState<string | null>(null)
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null)

  // A stale viewingPlayerId (from another group, or from before a lock-out) must never surface
  // once state lives up here instead of unmounting along with PlayersSection every time.
  useEffect(() => {
    setViewingPlayerId(null)
  }, [groupId, trainerAccess.unlocked])

  function closePlayerDetail() {
    setViewingPlayerId(null)
    window.scrollTo(0, 0)
  }

  /** Rethrows on failure so PlayerDetailScreen knows to stay in edit mode instead of exiting on a
   * failed save (the error is already reflected via `savePlayerError`, passed down alongside). */
  async function handleEditPlayer(
    playerId: string,
    nickname: string,
    jerseyNumber: number | null,
    jerseyColor: JerseyColor | null,
    heightCm: number | null,
    weightKg: number | null,
    targetGroupId: string,
    mascotId: string | null,
    eyeColor: EyeColor | null,
    gender: Gender | null,
  ) {
    setSavingPlayer(true)
    setSavePlayerError(null)

    try {
      await updatePlayer(
        playerId,
        targetGroupId,
        nickname,
        jerseyNumber,
        jerseyColor,
        heightCm,
        weightKg,
        mascotId,
        eyeColor,
        gender,
      )
    } catch (e) {
      setSavePlayerError(e instanceof Error ? e.message : 'Could not save player')
      throw e
    } finally {
      setSavingPlayer(false)
    }
  }

  async function handleRemovePlayer(id: string) {
    setRemovingPlayerId(id)

    try {
      await deletePlayer(id)
    } catch {
      // surfaced via the shared `playersError` from usePlayers on next refresh
    } finally {
      setRemovingPlayerId(null)
    }
  }

  // Prefer the shared, dated plan for this group (set up on the Groups tab) once one exists;
  // otherwise fall back to the default full session.
  const sessionPlan = useMemo(() => {
    if (!nextPlan) return activePlan
    const planExercises = nextPlan.exercise_ids
      .map((id) => findExercise(exercises, id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
    const planGroupName = groups.find((g) => g.id === nextPlan.group_id)?.name ?? nextPlan.group_id
    return {
      ...activePlan,
      planTitle: `${planGroupName} · ${formatDate(nextPlan.training_date)}`,
      planEmoji: nextPlan.emoji,
      planExercises,
      totalMinutes: planExercises.reduce((sum, e) => sum + e.durationMinutes, 0),
    }
  }, [nextPlan, activePlan, groups, exercises])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <ParentNoChildDialog
        open={parentMismatch}
        onOpenChange={() => { /* Only the links in the card leave this step. */ }}
        trainerAccess={trainerAccess}
        note={`This email is ${trainerAccess.roles.admin ? 'a platform admin' : 'a trainer'} account, not a parent account.`}
        notParentLabel={trainerAccess.roles.admin ? 'Continue to my admin account' : 'Continue to my trainer account'}
        onNotParent={() => { setSignInIntent(null); setParentMismatchAcknowledged(true) }}
        onCancel={trainerAccess.lock}
      />
      {!trainerAccess.unlocked ? (
        <LandingPage trainerAccess={trainerAccess} />
      ) : trainerAccess.kind === 'parent' || (asParent && trainerAccess.children.length > 0) ? (
        <>
          <ClubHeader
            trainerAccess={{
              kind: 'parent',
              lock: trainerAccess.lock,
              email: trainerAccess.signedInEmail,
              onSwitchToTrainer: trainerAccess.kind === 'trainer' ? () => setAsParent(false) : undefined,
              childOptions,
              onOpenChild: openChild,
            }}
          />
          <ParentHome linkedChildren={trainerAccess.children} selectedId={openChildId} onSelect={setOpenChildId} optionLabels={childLabels} />
        </>
      ) : trainerAccess.isSuperadmin && superadminView === 'dashboard' ? (
        <SuperAdminDashboard
          onOpenTrainingApp={() => setSuperadminView('training')}
          onLogout={trainerAccess.lock}
          onInviteOwner={trainerAccess.inviteOwnerForGroup}
          onOpenParentView={trainerAccess.children.length > 0 ? () => setAsParent(true) : undefined}
          childOptions={childOptions}
          onOpenChild={openChild}
          email={trainerAccess.signedInEmail}
        />
      ) : viewingPlayer ? (
        <PlayerDetailScreen
          player={viewingPlayer}
          plans={plans}
          groups={groups}
          onClose={closePlayerDetail}
          onSaveEdit={(...args) => handleEditPlayer(viewingPlayer.id, ...args)}
          saving={savingPlayer}
          saveError={savePlayerError}
          onRemove={async () => {
            await handleRemovePlayer(viewingPlayer.id)
            closePlayerDetail()
          }}
          removing={removingPlayerId === viewingPlayer.id}
        />
      ) : (
        <>
          <ClubHeader
            groupSwitcher={{ groups, groupId, setGroupId }}
            trainerAccess={{
              kind: 'trainer',
              lock: trainerAccess.lock,
              email: trainerAccess.signedInEmail,
              canInvite: trainerAccess.canInvite,
              inviteTrainer: trainerAccess.inviteTrainer,
              isSuperadmin: trainerAccess.isSuperadmin,
              inviteOwner: trainerAccess.inviteOwner,
              accountRole: trainerAccess.accountRole,
              onOpenParentView: trainerAccess.children.length > 0 ? () => setAsParent(true) : undefined,
              childOptions,
              onOpenChild: openChild,
            }}
            onAdminHome={
              trainerAccess.isSuperadmin
                ? () => setSuperadminView('dashboard')
                : undefined
            }
          />
          <div className="lg:flex">
            <SideNav active={tab} onChange={setTab} />
            <div className="min-w-0 flex-1">
              {tab === 'groups' && <GroupsScreen groupId={groupId} />}
              {tab === 'players' && (
                <PlayersScreen
                  groupId={groupId}
                  players={players}
                  loading={playersLoading}
                  error={playersError}
                  createPlayer={createPlayer}
                  onViewPlayer={setViewingPlayerId}
                />
              )}
              {tab === 'library' && <ExercisesScreen trainerAccess={trainerAccess} />}
              {tab === 'session' && (
                <SessionScreen
                  activePlan={sessionPlan}
                  planId={nextPlan?.id ?? null}
                  groupId={groupId}
                  groupTemplateId={groupTemplateId}
                  groupTemplateLabel={groupTemplateLabel}
                  trainerAccess={trainerAccess}
                  onBuildPlan={() => setTab('groups')}
                />
              )}
              <BottomNav active={tab} onChange={setTab} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
