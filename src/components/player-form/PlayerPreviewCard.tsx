import type { JerseyColor } from '../../hooks/usePlayers'
import { JerseyGraphic } from '../JerseyGraphic'

/** Live preview of the jersey being built in a create/edit form — mirrors the in-progress
 * nickname/color/number back to the trainer as they change them, instead of only showing the
 * result after Save. */
export function PlayerPreviewCard({
  nickname,
  jerseyColor,
  jerseyNumber,
  groupId,
  mascotId,
}: {
  nickname: string
  jerseyColor: JerseyColor | null
  jerseyNumber: number | null
  /** Omit when no group is known yet (e.g. CreatePlayerForm) -- see JerseyGraphic's own doc
   * comment on why that falls back to the shared stopgap art instead of erroring. */
  groupId?: string
  mascotId?: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <JerseyGraphic
        color={jerseyColor}
        number={jerseyNumber}
        nickname={nickname.trim() || 'Preview'}
        size="lg"
        groupId={groupId}
        mascotId={mascotId}
      />
      <p className="max-w-full truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {nickname.trim() || 'New player'}
      </p>
    </div>
  )
}
