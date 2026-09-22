import { useClub } from '../hooks/useClub'
import type { Player, usePlayers } from '../hooks/usePlayers'
import { GroupProgressSummary } from './GroupProgressSummary'
import { PlayersSection } from './PlayersSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function PlayersScreen({
  groupId,
  players,
  loading,
  error,
  createPlayer,
  onViewPlayer,
}: {
  groupId: string
  players: Player[]
  loading: boolean
  error: string | null
  createPlayer: ReturnType<typeof usePlayers>['createPlayer']
  onViewPlayer: (id: string) => void
}) {
  // Always unlocked here — the app-level gate in App.tsx (see LockScreen) never renders this
  // screen otherwise. Logging out is handled globally, via the ClubHeader trainer-access menu.
  const club = useClub()

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4 md:max-w-3xl lg:max-w-5xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Players</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          The kids in this group — nickname only, no real names — and how their training's going.
        </p>
        {club.tier === 'free' && (
          <p className="mt-2 text-sm text-muted-foreground">
            FREE supports 6 players across the club. Existing players stay; adding more is blocked while above the limit.
          </p>
        )}
      </header>

      <Tabs defaultValue="stats">
        <TabsList className="w-full">
          <TabsTrigger value="stats">Player stats</TabsTrigger>
          <TabsTrigger value="progress">Group progress</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <PlayersSection
            groupId={groupId}
            players={players}
            loading={loading}
            error={error}
            createPlayer={createPlayer}
            onViewPlayer={onViewPlayer}
          />
        </TabsContent>

        <TabsContent value="progress">
          <GroupProgressSummary groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
