import { useEffect, useMemo, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { ClubHeader } from './components/ClubHeader'
import { ExercisesScreen } from './components/ExercisesScreen'
import { GroupsScreen } from './components/GroupsScreen'
import { LockScreen } from './components/LockScreen'
import { ParentView } from './components/ParentView'
import { PlayerDetailScreen } from './components/PlayerDetailScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { SessionScreen } from './components/SessionScreen'
import { SideNav } from './components/SideNav'
import { useActiveGroup } from './hooks/useActiveGroup'
import { useActivePlan } from './hooks/useActivePlan'
import { findExercise, useExercises } from './hooks/useExercises'
import { useGroups } from './hooks/useGroups'
import { usePlans } from './hooks/usePlans'
import { type EyeColor, type JerseyColor, usePlayers } from './hooks/usePlayers'
import { useTrainerAccess } from './hooks/useTrainerAccess'
import { formatDate } from './utils/format'

function App() {
  const [tab, setTab] = useState<Tab>('groups')
  const activePlan = useActivePlan()
  const { groupId, setGroupId } = useActiveGroup()
  const { groups } = useGroups()
  const { exercises } = useExercises()
  const { plans, nextPlan } = usePlans(groupId)
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
  // Shared across tabs so a trainer code entered on Groups also unlocks session controls.
  // Scoped to the active group — each group has its own passcode.
  const trainerAccess = useTrainerAccess(groupId)

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
  ) {
    setSavingPlayer(true)
    setSavePlayerError(null)

    try {
      await updatePlayer(
        trainerAccess.passcode(),
        playerId,
        targetGroupId,
        nickname,
        jerseyNumber,
        jerseyColor,
        heightCm,
        weightKg,
        mascotId,
        eyeColor,
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
      await deletePlayer(trainerAccess.passcode(), id)
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
        <>
          <ClubHeader />
          <LockScreen groupId={groupId} onSelectGroup={setGroupId} trainerAccess={trainerAccess} />
        </>
      ) : trainerAccess.kind === 'parent' && trainerAccess.parentPlayer ? (
        <>
          <ClubHeader trainerAccess={{ kind: 'parent', lock: trainerAccess.lock }} />
          <ParentView groupId={groupId} player={trainerAccess.parentPlayer} />
        </>
      ) : viewingPlayer ? (
        <PlayerDetailScreen
          player={viewingPlayer}
          plans={plans}
          groups={groups}
          passcode={trainerAccess.passcode}
          onClose={closePlayerDetail}
          onRosterChange={refreshPlayers}
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
            trainerAccess={{ kind: 'trainer', lock: trainerAccess.lock }}
          />
          <div className="lg:flex">
            <SideNav active={tab} onChange={setTab} />
            <div className="min-w-0 flex-1">
              {tab === 'groups' && <GroupsScreen groupId={groupId} trainerAccess={trainerAccess} />}
              {tab === 'players' && (
                <PlayersScreen
                  groupId={groupId}
                  trainerAccess={trainerAccess}
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
