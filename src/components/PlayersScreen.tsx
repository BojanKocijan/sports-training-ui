import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { GroupProgressSummary } from './GroupProgressSummary'
import { PlayersSection } from './PlayersSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function PlayersScreen({
  groupId,
  trainerAccess,
}: {
  groupId: string
  trainerAccess: ReturnType<typeof useTrainerAccess>
}) {
  // Always unlocked here — the app-level gate in App.tsx (see LockScreen) never renders this
  // screen otherwise. Logging out is handled globally, via the ClubHeader trainer-access menu.
  const { passcode } = trainerAccess

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4 md:max-w-3xl lg:max-w-5xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Players</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          The kids in this group — nickname only, no real names — and how their training's going.
        </p>
      </header>

      <Tabs defaultValue="stats">
        <TabsList className="w-full">
          <TabsTrigger value="stats">Player stats</TabsTrigger>
          <TabsTrigger value="progress">Group progress</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <PlayersSection groupId={groupId} passcode={passcode} />
        </TabsContent>

        <TabsContent value="progress">
          <GroupProgressSummary groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
