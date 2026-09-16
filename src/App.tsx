import { useMemo, useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { ClubHeader } from './components/ClubHeader'
import { ExercisesScreen } from './components/ExercisesScreen'
import { GroupsScreen } from './components/GroupsScreen'
import { LockScreen } from './components/LockScreen'
import { ParentView } from './components/ParentView'
import { PlayersScreen } from './components/PlayersScreen'
import { SessionScreen } from './components/SessionScreen'
import { SideNav } from './components/SideNav'
import { useActiveGroup } from './hooks/useActiveGroup'
import { useActivePlan } from './hooks/useActivePlan'
import { findExercise, useExercises } from './hooks/useExercises'
import { useGroups } from './hooks/useGroups'
import { usePlans } from './hooks/usePlans'
import { useTrainerAccess } from './hooks/useTrainerAccess'
import { formatDate } from './utils/format'

function App() {
  const [tab, setTab] = useState<Tab>('groups')
  const activePlan = useActivePlan()
  const { groupId, setGroupId } = useActiveGroup()
  const { groups } = useGroups()
  const { exercises } = useExercises()
  const { nextPlan } = usePlans(groupId)
  // Shared across tabs so a trainer code entered on Groups also unlocks session controls.
  // Scoped to the active group — each group has its own passcode.
  const trainerAccess = useTrainerAccess(groupId)

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
              {tab === 'players' && <PlayersScreen groupId={groupId} trainerAccess={trainerAccess} />}
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
