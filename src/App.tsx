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
import { useTrainerAccess } from './hooks/useTrainerAccess'
import { formatDate } from './utils/format'

function App() {
  const [tab, setTab] = useState<Tab>('groups')
  // A trainer whose email is also linked to a child can flip to that child's parent view.
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
      {!trainerAccess.unlocked ? (
        <LandingPage trainerAccess={trainerAccess} />
      ) : trainerAccess.kind === 'parent' || (asParent && trainerAccess.children.length > 0) ? (
        <>
          <ClubHeader
            trainerAccess={{
              kind: 'parent',
              lock: trainerAccess.lock,
              onSwitchToTrainer: trainerAccess.kind === 'trainer' ? () => setAsParent(false) : undefined,
            }}
          />
          <ParentHome linkedChildren={trainerAccess.children} />
        </>
      ) : trainerAccess.isSuperadmin && superadminView === 'dashboard' ? (
        <SuperAdminDashboard
          onOpenTrainingApp={() => setSuperadminView('training')}
          onLogout={trainerAccess.lock}
          onInviteOwner={trainerAccess.inviteOwnerForGroup}
          onOpenParentView={trainerAccess.children.length > 0 ? () => setAsParent(true) : undefined}
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
              canInvite: trainerAccess.canInvite,
              inviteTrainer: trainerAccess.inviteTrainer,
              isSuperadmin: trainerAccess.isSuperadmin,
              inviteOwner: trainerAccess.inviteOwner,
              accountRole: trainerAccess.accountRole,
              onOpenParentView: trainerAccess.children.length > 0 ? () => setAsParent(true) : undefined,
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
              {tab === 'library' && <ExercisesScreen />}
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
